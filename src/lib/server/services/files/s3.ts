import { env } from "$env/dynamic/private";
import { CHUNK_SIZE, getPartCount, type MultiPartUploadParams } from "$lib/common/utils/files";
import { db } from "$lib/server/db";
import { assetTable, s3FileTable } from "$lib/server/db/schema";
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { asyncMap } from "modern-async";
import { eq } from "drizzle-orm";
import { Readable } from "stream";
import { z } from "zod/v4";
import { signJwt, verifyJwt } from "$lib/server/jwt";

export class FileAttachmentsNotEnabledError extends Error {
  constructor() {
    super("File attachments are not enabled");
  }
}

let clientCache: S3Client | null = null;

function getS3Client() {
  if (clientCache) {
    return clientCache;
  }

  clientCache = new S3Client({
    region: env.MINIO_REGION,
    endpoint: env.MINIO_ENDPOINT,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
  });

  return clientCache;
}

export async function verifyS3Bucket(): Promise<boolean> {
  const client = getS3Client();

  try {
    await client.send(
      new HeadBucketCommand({
        Bucket: env.MINIO_BUCKET,
      }),
    );
    return true;
  } catch {
    // If bucket doesn't exist or any other S3 error occurs, return false
    return false;
  }
}

export async function createS3BucketIfNotExists() {
  const client = getS3Client();

  try {
    await client.send(
      new CreateBucketCommand({
        Bucket: env.MINIO_BUCKET,
      }),
    );
  } catch {
    // If bucket already exists, do nothing
  }
}

export function createFileIdentifier(userId: string, fileName: string) {
  const id = crypto.randomUUID();
  const key = `${userId}/${id}-${fileName}`;

  return {
    id,
    key,
  };
}

export async function createFile(
  userId: string,
  params: {
    fileName: string;
    size: number;
    contentType: string;
    hash?: string | null;
  },
) {
  const { id, key } = createFileIdentifier(userId, params.fileName);

  const [s3File] = await db
    .insert(s3FileTable)
    .values({
      id,
      userId,
      key,
      fileName: params.fileName,
      size: params.size,
      contentType: params.contentType,
      hash: params.hash,
    })
    .returning();

  return s3File;
}

export const s3FileMetadata = z.object({
  fileId: z.string(),
  key: z.string(),
  userId: z.string(),
  uploadStartedAt: z.string(),
  size: z.coerce.number().int().positive(),
  contentType: z.string(),
  hash: z.string(),
  fileName: z.string(),
});

export async function generateSinglePartUploadParams(
  userId: string,
  fileName: string,
  contentType: string,
  size: number,
  hash: string,
) {
  const client = getS3Client();
  const { key, id } = createFileIdentifier(userId, fileName);

  const uploadToken = await signJwt({
    fileId: id,
    key,
    userId,
    uploadStartedAt: new Date().toISOString(),
    size,
    contentType,
    hash,
    fileName,
  });

  const command = new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    ChecksumAlgorithm: "SHA256",
    ChecksumSHA256: hash,
    Metadata: {
      uploadToken,
    },
  });

  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: 15 * 60, // 15 minutes
  });

  return {
    presignedUrl,
    uploadToken,
  };
}

export async function generateMultiPartUploadParams(
  userId: string,
  fileName: string,
  contentType: string,
  size: number,
  hashParts: {
    partNumber: number;
    hash: string;
  }[],
  compositeHash: string,
) {
  const client = getS3Client();

  const { key, id } = createFileIdentifier(userId, fileName);

  const uploadToken = await signJwt({
    fileId: id,
    key,
    userId,
    uploadStartedAt: new Date().toISOString(),
    size,
    contentType,
    hash: compositeHash,
    fileName,
  });

  const command = new CreateMultipartUploadCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    ContentType: contentType,
    ChecksumAlgorithm: "SHA256",
    ChecksumType: "COMPOSITE",
    Expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    Metadata: {
      uploadToken,
    },
  });

  const result = await client.send(command);

  const partCount = getPartCount(size);

  if (hashParts.length !== partCount) {
    throw new Error("Invalid number of hash parts");
  }

  const danglingSize = size % CHUNK_SIZE;

  const parts: MultiPartUploadParams["parts"] = await asyncMap(
    hashParts,
    async (part, index) => {
      if (part.partNumber !== index + 1) {
        throw new Error("Invalid part number");
      }

      const isLastPart = part.partNumber === partCount;
      const command = new UploadPartCommand({
        Bucket: env.MINIO_BUCKET,
        Key: key,
        PartNumber: part.partNumber,
        UploadId: result.UploadId,
        ChecksumAlgorithm: "SHA256",
        ChecksumSHA256: part.hash,
        ContentLength: isLastPart ? danglingSize : CHUNK_SIZE,
      });

      const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: 15 * 60, // 15 minutes
      });

      return {
        partNumber: part.partNumber,
        presignedUrl,
      };
    },
    10,
  );

  return {
    parts,
    uploadId: result.UploadId,
    uploadToken,
  };
}

export async function finishFileUpload(fileMetadata: z.infer<typeof s3FileMetadata>) {
  await db.transaction(async (tx) => {
    const [existingFile] = await tx
      .select()
      .from(s3FileTable)
      .where(eq(s3FileTable.key, fileMetadata.key))
      .for("update");

    if (existingFile) {
      // Maybe there's a race condition here, so if we're calling fininsh uploading again, we return the existing file and asset
      const asset = await tx.select().from(assetTable).where(eq(assetTable.id, existingFile.id));

      if (!asset) {
        throw new Error("Asset not found");
      }

      return {
        file: existingFile,
        asset,
      };
    }

    const [file] = await tx
      .insert(s3FileTable)
      .values({
        id: fileMetadata.fileId,
        key: fileMetadata.key,
        userId: fileMetadata.userId,
        fileName: fileMetadata.fileName,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        hash: fileMetadata.hash,
      })
      .returning();

    if (!file) {
      throw new Error("File not found");
    }

    const [asset] = await tx
      .insert(assetTable)
      .values({
        id: file.id,
        userId: file.userId,
        assetType: "s3_file",
        assetId: file.id,
        name: file.fileName,
      })
      .returning();

    try {
      // Generating alternative files
    } catch (error) {
      console.error(error);
    }

    return {
      file,
      asset,
    };
  });
}

export async function confirmMultiPartUpload(
  uploadId: string,
  fileMetadata: z.infer<typeof s3FileMetadata>,
) {
  const client = getS3Client();

  const command = new CompleteMultipartUploadCommand({
    Bucket: env.MINIO_BUCKET,
    Key: fileMetadata.key,
    UploadId: uploadId,
    ChecksumSHA256: fileMetadata.hash,
    ChecksumType: "COMPOSITE",
  });

  const res = await client.send(command);

  console.log(res);

  return await finishFileUpload(fileMetadata);
}

export async function abortMultiPartUpload(
  uploadId: string,
  fileMetadata: z.infer<typeof s3FileMetadata>,
) {
  const client = getS3Client();

  const command = new AbortMultipartUploadCommand({
    Bucket: env.MINIO_BUCKET,
    Key: fileMetadata.key,
    UploadId: uploadId,
  });

  await client.send(command);

  return {
    uploadId,
  };
}

export async function deleteFile(fileId: string) {
  const client = getS3Client();

  await db.transaction(async (tx) => {
    const [file] = await tx.delete(s3FileTable).where(eq(s3FileTable.id, fileId)).returning();

    if (!file) {
      throw new Error("File not found");
    }

    const command = new DeleteObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: file.key,
    });

    await client.send(command);

    await tx.delete(assetTable).where(eq(assetTable.id, file.id));
  });
}

export async function getS3File(key: string) {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
  });

  const result = await client.send(command);

  return result.Body;
}

export async function getS3FileStream(key: string): Promise<Readable> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
  });

  const result = await client.send(command);

  if (!result.Body) {
    throw new Error("No file body received from S3");
  }

  // In Node.js environments, result.Body should be a Readable stream
  return result.Body as Readable;
}

export async function putS3File(key: string, body: Readable) {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    Body: body,
  });

  await client.send(command);
}

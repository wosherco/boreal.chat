import { env } from "$env/dynamic/private";
import { CHUNK_SIZE, type MultiPartUploadParams } from "$lib/common/utils/files";
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
import { mapLimit } from "async";
import { eq } from "drizzle-orm";
import { Readable } from "stream";

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

export async function createFile(
  userId: string,
  params: {
    fileName: string;
    size: number;
    contentType: string;
    hash?: string | null;
  },
) {
  const id = crypto.randomUUID();
  const key = `${userId}/${id}-${params.fileName}`;

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

export async function generateSinglePartUploadParams(
  key: string,
  contentType: string,
  size: number,
  hash: string,
) {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    ChecksumAlgorithm: "SHA256",
    ChecksumSHA256: hash,
  });

  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: 15 * 60, // 15 minutes
  });

  return {
    presignedUrl,
  };
}

export async function generateMultiPartUploadParams(
  key: string,
  contentType: string,
  size: number,
) {
  const client = getS3Client();

  const command = new CreateMultipartUploadCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    ContentType: contentType,
    ChecksumAlgorithm: "SHA256",
    ChecksumType: "COMPOSITE",
    Expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  });

  const result = await client.send(command);

  const partCount = Math.ceil(size / CHUNK_SIZE);
  const danglingSize = size % CHUNK_SIZE;

  const parts: MultiPartUploadParams["parts"] = await mapLimit<
    number,
    MultiPartUploadParams["parts"][number]
  >(
    new Array(partCount).fill(0).map((_, i) => i + 1),
    10,
    async (partNumber: number) => {
      const isLastPart = partNumber === partCount;
      const command = new UploadPartCommand({
        Bucket: env.MINIO_BUCKET,
        Key: key,
        PartNumber: partNumber,
        UploadId: result.UploadId,
        ChecksumAlgorithm: "SHA256",
        ContentLength: isLastPart ? danglingSize : CHUNK_SIZE,
      });

      const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: 15 * 60, // 15 minutes
      });

      return {
        partNumber,
        presignedUrl,
      };
    },
  );

  return {
    parts,
    key,
    uploadId: result.UploadId,
  };
}

export async function finishFileUpload(key: string) {
  const [file] = await db
    .update(s3FileTable)
    .set({
      status: "uploaded",
    })
    .where(eq(s3FileTable.key, key))
    .returning();

  if (!file) {
    throw new Error("File not found");
  }

  const [asset] = await db
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
}

export async function confirmMultiPartUpload(key: string, uploadId: string, hash: string) {
  const client = getS3Client();

  const command = new CompleteMultipartUploadCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    UploadId: uploadId,
    ChecksumSHA256: hash,
    ChecksumType: "COMPOSITE",
  });

  await client.send(command);

  return await finishFileUpload(key);
}

export async function abortMultiPartUpload(key: string, uploadId: string) {
  const client = getS3Client();

  const command = new AbortMultipartUploadCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    UploadId: uploadId,
  });

  await client.send(command);

  return {
    key,
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

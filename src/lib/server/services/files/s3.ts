import { env } from "$env/dynamic/private";
import {
  getPartCount,
  calculateChunkContentLength,
  type MultiPartUploadParams,
} from "$lib/common/utils/files";
import { db } from "$lib/server/db";
import { assetTable, s3FileTable } from "$lib/server/db/schema";
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, sum } from "drizzle-orm";
import { Readable } from "stream";
import { z } from "zod/v4";
import { signJwt } from "$lib/server/jwt";
import { generateStreamHash } from "$lib/server/utils/crypto";
import Aigle from "aigle";

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
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  return clientCache;
}

export function createFileIdentifier(userId: string) {
  const id = crypto.randomUUID();
  const key = `${userId}/${id}`;

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
  const { id, key } = createFileIdentifier(userId);

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
  const { key, id } = createFileIdentifier(userId);

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
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
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
  hash: string,
) {
  const client = getS3Client();

  const { key, id } = createFileIdentifier(userId);

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

  const command = new CreateMultipartUploadCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    Metadata: {
      uploadToken,
    },
  });

  const result = await client.send(command);

  if (!result.UploadId) {
    throw new Error("Failed to create multipart upload");
  }

  const partCount = getPartCount(size);

  const parts: MultiPartUploadParams["parts"] = await Aigle.mapLimit(
    new Array(partCount).fill(0),
    10,
    async (_, index) => {
      const partNumber = index + 1;

      const isLastPart = partNumber === partCount;
      const command = new UploadPartCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        PartNumber: partNumber,
        UploadId: result.UploadId,
        ContentLength: calculateChunkContentLength(isLastPart, size),
      });

      const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: 15 * 60,
      });

      return {
        partNumber,
        presignedUrl,
      };
    },
  );

  return {
    parts,
    uploadId: result.UploadId,
    uploadToken,
  };
}

export async function finishFileUpload(fileMetadata: z.infer<typeof s3FileMetadata>) {
  // We calculate the hash of the file in S3
  const fileStream = await getS3FileStream(fileMetadata.key);

  const hash = await generateStreamHash(fileStream);

  if (hash !== fileMetadata.hash) {
    await deleteS3File(fileMetadata.key);
    throw new Error("File hash mismatch");
  }

  return await db.transaction(async (tx) => {
    await tx
      .insert(s3FileTable)
      .values({
        id: fileMetadata.fileId,
        key: fileMetadata.key,
        userId: fileMetadata.userId,
        fileName: fileMetadata.fileName,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        hash,
      })
      .onConflictDoNothing({
        target: [s3FileTable.id],
      });

    const [file] = await tx
      .select()
      .from(s3FileTable)
      .where(eq(s3FileTable.id, fileMetadata.fileId));

    if (!file) {
      throw new Error("File not found");
    }

    await tx
      .insert(assetTable)
      .values({
        id: file.id,
        userId: file.userId,
        assetType: "s3_file",
        assetId: file.id,
        name: file.fileName,
      })
      .onConflictDoNothing({
        target: [assetTable.id],
      });

    const [finalResult] = await tx
      .select({
        file: s3FileTable,
        asset: assetTable,
      })
      .from(s3FileTable)
      .innerJoin(assetTable, eq(s3FileTable.id, assetTable.assetId))
      .where(eq(s3FileTable.id, fileMetadata.fileId));

    if (!finalResult) {
      throw new Error("File not found");
    }

    return finalResult;
  });
}

export async function confirmMultiPartUpload(
  uploadId: string,
  fileMetadata: z.infer<typeof s3FileMetadata>,
  parts: {
    partNumber: number;
    etag: string;
  }[],
) {
  const client = getS3Client();

  const command = new CompleteMultipartUploadCommand({
    Bucket: env.S3_BUCKET,
    Key: fileMetadata.key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((part) => ({
        ETag: part.etag,
        PartNumber: part.partNumber,
      })),
    },
  });

  await client.send(command);

  return await finishFileUpload(fileMetadata);
}

export async function abortMultiPartUpload(
  uploadId: string,
  fileMetadata: z.infer<typeof s3FileMetadata>,
) {
  const client = getS3Client();

  const command = new AbortMultipartUploadCommand({
    Bucket: env.S3_BUCKET,
    Key: fileMetadata.key,
    UploadId: uploadId,
  });

  await client.send(command);

  return {
    uploadId,
  };
}

export async function deleteFile(fileId: string) {
  await db.transaction(async (tx) => {
    const [file] = await tx.delete(s3FileTable).where(eq(s3FileTable.id, fileId)).returning();

    if (!file) {
      throw new Error("File not found");
    }

    await tx
      .delete(assetTable)
      .where(and(eq(assetTable.id, file.id), eq(assetTable.assetType, "s3_file")));

    await deleteS3File(file.key);
  });
}

export async function deleteS3File(key: string) {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  await client.send(command);
}

export async function getS3File(key: string) {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  const result = await client.send(command);

  return result.Body;
}

export async function getS3FileStream(key: string): Promise<Readable> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
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
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: body,
  });

  await client.send(command);
}

/**
 * @param userId - The user ID
 * @param fileHash - The SHA512 hash of the file
 * @returns The file row if found, otherwise null
 */
export async function getFileWithHash(userId: string, fileHash: string) {
  const [row] = await db
    .select()
    .from(s3FileTable)
    .innerJoin(
      assetTable,
      and(eq(s3FileTable.id, assetTable.assetId), eq(assetTable.assetType, "s3_file")),
    )
    .where(and(eq(s3FileTable.userId, userId), eq(s3FileTable.hash, fileHash)))
    .limit(1);

  if (!row) {
    return null;
  }

  return row;
}

export async function getTotalFileUsage(userId: string): Promise<number> {
  const [result] = await db
    .select({ totalSize: sum(s3FileTable.size) })
    .from(s3FileTable)
    .where(eq(s3FileTable.userId, userId));

  const parsed = Number(result?.totalSize ?? 0);

  return isNaN(parsed) ? 0 : parsed;
}

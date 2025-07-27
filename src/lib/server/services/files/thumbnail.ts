import type { DBS3File } from "$lib/common/schema/files";
import { IMAGE_MIME_TYPES } from "$lib/common/utils/files";
import { db } from "$lib/server/db";
import { s3FileTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { getS3FileStream, putS3File } from "./s3";
import sharp from "sharp";
import { Readable } from "stream";

export async function getFileThumbnail(file: DBS3File): Promise<Readable | null> {
  if (!file.thumbnailKey) {
    // We generate the thumbnail on the fly and save it to the database, S3, and return the stream
    const thumbnailStream = await generateThumbnail(file);

    if (!thumbnailStream) {
      return null;
    }

    const thumbnailKey = `${file.key}-thumbnail`;
    await putS3File(thumbnailKey, thumbnailStream);

    await db
      .update(s3FileTable)
      .set({
        thumbnailKey,
      })
      .where(eq(s3FileTable.id, file.id));

    return thumbnailStream;
  }

  return getS3FileStream(file.thumbnailKey);
}

export async function getAIFile(file: DBS3File): Promise<Readable | null> {
  if (!file.aiFileKey) {
    // We generate the AI file on the fly and save it to the database, S3, and return the stream
    const aiFileStream = await processImageForAI(file);

    if (!aiFileStream) {
      return null;
    }

    const aiFileKey = `${file.key}-ai`;
    await putS3File(aiFileKey, aiFileStream);

    await db
      .update(s3FileTable)
      .set({
        aiFileKey,
      })
      .where(eq(s3FileTable.id, file.id));

    return aiFileStream;
  }

  return getS3FileStream(file.aiFileKey);
}

export async function generateThumbnail(file: DBS3File): Promise<Readable | null> {
  // Check if the file is a supported image type
  if (!IMAGE_MIME_TYPES.includes(file.contentType)) {
    return null;
  }

  try {
    // Get the original file stream
    const fileStream = await getS3FileStream(file.key);

    // Create a Sharp transform stream for thumbnail generation
    const thumbnailTransform = sharp()
      .resize(300, 300, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4,
      });

    // Pipe the file stream through Sharp to create thumbnail
    return fileStream.pipe(thumbnailTransform);
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
}

export async function processImageForAI(file: DBS3File): Promise<Readable | null> {
  // Check if the file is a supported image type
  if (!IMAGE_MIME_TYPES.includes(file.contentType)) {
    return null;
  }

  try {
    // Get the original file stream
    const fileStream = await getS3FileStream(file.key);

    // Create a Sharp transform stream for AI processing
    const aiProcessTransform = sharp()
      .resize(2048, 2048, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true,
      });

    // Pipe the file stream through Sharp to create AI-optimized image
    return fileStream.pipe(aiProcessTransform);
  } catch (error) {
    console.error("Error processing image for AI:", error);
    return null;
  }
}

import { CHUNK_SIZE, getPartCount, isMultiPart, MAX_FILE_SIZE } from "$lib/common/utils/files";
import { backOff } from "exponential-backoff";
import { orpc } from "../orpc";
import { hashFileSmart } from "../utils/crypto";
import Aigle from "aigle";

async function uploadPart(url: string, part: Blob | File): Promise<{ etag: string }> {
  const data = await part.arrayBuffer();
  const res = await fetch(url, {
    method: "PUT",
    body: data,
  });

  if (!res.ok) {
    throw new Error("Failed to upload part");
  }

  const etag = res.headers.get("ETag") ?? "";

  if (etag === "") {
    throw new Error("Failed to upload part");
  }

  return {
    etag,
  };
}

async function chunkFile(file: File) {
  const totalChunks = getPartCount(file.size);
  const chunks: Blob[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);

    chunks.push(file.slice(start, end));
  }

  return chunks;
}

async function uploadSinglePartFile(file: File): Promise<{ assetId: string }> {
  let hash: string;
  try {
    hash = await hashFileSmart(file);
  } catch (e) {
    console.error(e);
    throw new Error("Failed to hash file");
  }

  let presignedUrl: string;
  let uploadToken: string;

  try {
    const singleFileUploadPayload = await orpc.v1.files.uploadSinglePartFile({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      hash,
    });

    if (singleFileUploadPayload.existing) {
      return {
        assetId: singleFileUploadPayload.data.assetId,
      };
    }

    presignedUrl = singleFileUploadPayload.data.presignedUrl;
    uploadToken = singleFileUploadPayload.data.uploadToken;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to prepare upload");
  }

  try {
    await backOff(() => uploadPart(presignedUrl, file), {
      numOfAttempts: 3,
      timeMultiple: 2,
      jitter: "full",
      retry(e, attemptNumber) {
        console.warn(`[${file.name}] Failed to upload part`, e);
        console.warn(`[${file.name}] Failed in attempt ${attemptNumber}, Retrying...`);

        return true;
      },
    });
  } catch (e) {
    console.error(e);
    throw new Error("Failed to upload file");
  }

  try {
    const finishUploadPayload = await orpc.v1.files.finishSinglePartFile({
      uploadToken,
    });

    return {
      assetId: finishUploadPayload.assetId,
    };
  } catch (e) {
    console.error(e);
    throw new Error("Failed to finish upload");
    // Maybe here we can assumed it finished, but we need to retrieve the asset id anyways
  }
}

export async function uploadFile(file: File): Promise<{ assetId: string }> {
  if (file.size <= 0) {
    throw new Error("Invalid file size");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too big");
  }

  const multipart = isMultiPart(file.size);

  if (!multipart) {
    return uploadSinglePartFile(file);
  }

  let chunks: Blob[];
  let hash: string;

  try {
    [chunks, hash] = await Promise.all([chunkFile(file), hashFileSmart(file)]);
  } catch (e) {
    console.error(e);
    throw new Error("Failed to hash or chunk file");
  }

  let parts: {
    partNumber: number;
    presignedUrl: string;
  }[];
  let uploadId: string;
  let uploadToken: string;

  try {
    const presignedData = await orpc.v1.files.uploadMultiPartFile({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      hash,
    });

    if (presignedData.existing) {
      return {
        assetId: presignedData.data.assetId,
      };
    }

    uploadId = presignedData.data.uploadId;
    uploadToken = presignedData.data.uploadToken;
    parts = presignedData.data.parts;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to prepare upload");
  }

  let uploadedParts: { etag: string; partNumber: number }[];

  try {
    uploadedParts = await Aigle.mapLimit(parts, 4, async (part) => {
      const chunk = chunks[part.partNumber - 1];

      try {
        const { etag } = await backOff(() => uploadPart(part.presignedUrl, chunk), {
          numOfAttempts: 3,
          timeMultiple: 2,
          jitter: "full",
          retry(e, attemptNumber) {
            console.warn(`[${file.name}-${part.partNumber}] Failed to upload part`, e);
            console.warn(
              `[${file.name}-${part.partNumber}] Failed in attempt ${attemptNumber}, Retrying...`,
            );

            return true;
          },
        });

        return {
          etag,
          partNumber: part.partNumber,
        };
      } catch (e) {
        console.error(e);
        throw new Error("Failed to upload part");
      }
    });
  } catch (e) {
    console.error(e);
    throw new Error("Failed to upload parts");
  }

  // Finishing the upload
  try {
    const finishUploadPayload = await orpc.v1.files.finishMultiPartUpload({
      uploadId,
      uploadToken,
      parts: uploadedParts,
    });

    return {
      assetId: finishUploadPayload.assetId,
    };
  } catch (e) {
    console.error(e);
    throw new Error("Failed to finish upload");
  }
}

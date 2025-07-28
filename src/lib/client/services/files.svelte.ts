import { CHUNK_SIZE, getPartCount, isMultiPart } from "$lib/common/utils/files";
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

export async function uploadFile(file: File): Promise<{ assetId: string }> {
  const multipart = isMultiPart(file.size);

  if (!multipart) {
    const hash = await hashFileSmart(file);

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

    const { presignedUrl, uploadToken } = singleFileUploadPayload.data;

    await uploadPart(presignedUrl, file);

    const finishUploadPayload = await orpc.v1.files.finishSinglePartFile({
      uploadToken,
    });

    return {
      assetId: finishUploadPayload.assetId,
    };
  }

  const [chunks, hash] = await Promise.all([chunkFile(file), hashFileSmart(file)]);

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

  const parts = await Aigle.mapLimit(presignedData.data.parts, 1, async (part) => {
    const chunk = chunks[part.partNumber - 1];

    const { etag } = await uploadPart(part.presignedUrl, chunk);

    return {
      etag,
      partNumber: part.partNumber,
    };
  });

  // Finishing the upload
  const finishUploadPayload = await orpc.v1.files.finishMultiPartUpload({
    uploadId: presignedData.data.uploadId,
    uploadToken: presignedData.data.uploadToken,
    parts: parts,
  });

  return {
    assetId: finishUploadPayload.assetId,
  };
}

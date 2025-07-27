import { CHUNK_SIZE, getPartCount, isMultiPart } from "$lib/common/utils/files";
import { orpc } from "../orpc";
import { hashFileChunked, hashFileSmart } from "../utils/crypto";
import { asyncForEach } from "modern-async";

async function uploadPart(url: string, part: ReadableStream<Uint8Array>) {
  const res = await fetch(url, {
    method: "PUT",
    body: part,
  });

  if (!res.ok) {
    throw new Error("Failed to upload part");
  }

  return res;
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

export async function uploadFile(file: File) {
  const multipart = isMultiPart(file.size);
  let hash: string | undefined;

  if (!multipart) {
    hash = await hashFileSmart(file);

    const presignedData = await orpc.v1.files.uploadSinglePartFile({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      hash,
    });

    const { presignedUrl } = presignedData;

    await uploadPart(presignedUrl, file.stream());

    return {
      uploadToken: presignedData.uploadToken,
    };
  }

  const chunks = await chunkFile(file);
  const { chunkHashes, compositeHash } = await hashFileChunked(chunks);

  const presignedData = await orpc.v1.files.uploadMultiPartFile({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    parts: chunkHashes.map((hash, index) => ({
      partNumber: index + 1,
      hash,
    })),
    hash: compositeHash,
  });

  await asyncForEach(
    presignedData.parts,
    async (part, index) => {
      const chunk = chunks[index];
      const res = await uploadPart(part.presignedUrl, chunk.stream());

      if (!res.ok) {
        throw new Error("Failed to upload part");
      }
    },
    4,
  );

  // Finishing the upload
  console.log("FINISHED");
}

export interface SinglePartUploadParams {
  presignedUrl: string;
}

export interface MultiPartUploadParams {
  parts: {
    partNumber: number;
    presignedUrl: string;
  }[];
  key: string;
  uploadId: string;
}

export type UploadParams = SinglePartUploadParams | MultiPartUploadParams;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MINIMUM_SIZE_FOR_MULTIPART = 20 * 1024 * 1024; // 20MB
export const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

export const isMultiPart = (size: number) => size > MINIMUM_SIZE_FOR_MULTIPART;
export const getPartCount = (size: number) => Math.ceil(size / CHUNK_SIZE);

/**
 * Calculates the content length for a chunk in a multipart upload.
 * For the last part, if there's a remainder (danglingSize > 0), use that.
 * Otherwise, use the full CHUNK_SIZE to avoid invalid 0-length parts.
 */
export const calculateChunkContentLength = (
  isLastPart: boolean,
  totalSize: number,
  chunkSize: number = CHUNK_SIZE,
) => {
  const danglingSize = totalSize % chunkSize;
  return isLastPart && danglingSize > 0 ? danglingSize : chunkSize;
};

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/flif",
  "image/cr2",
  "image/tif",
  "image/bmp",
  "image/jxr",
  "image/psd",
  "image/ico",
  "image/bpg",
  "image/jp2",
  "image/jpm",
  "image/jpx",
  "image/heic",
  "image/cur",
  "image/dcm",
  "image/svg",
];

export const isImage = (contentType: string) => IMAGE_MIME_TYPES.includes(contentType);

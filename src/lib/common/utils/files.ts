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
export const MINIMUM_SIZE_FOR_MULTIPART = 3 * 1024 * 1024; // 20MB
export const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

export const isMultiPart = (size: number) => size > MINIMUM_SIZE_FOR_MULTIPART;
export const getPartCount = (size: number) => Math.ceil(size / CHUNK_SIZE);

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

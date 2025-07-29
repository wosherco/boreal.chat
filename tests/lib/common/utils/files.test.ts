import { describe, it, expect } from "vitest";
import {
  isImage,
  IMAGE_MIME_TYPES,
  calculateChunkContentLength,
  CHUNK_SIZE,
} from "../../../../src/lib/common/utils/files";

describe("common files utilities", () => {
  describe("isImage", () => {
    it("should return true for all supported image MIME types", () => {
      const supportedTypes = [
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

      supportedTypes.forEach((mimeType) => {
        expect(isImage(mimeType)).toBe(true);
      });
    });

    it("should return false for non-image MIME types", () => {
      const nonImageTypes = [
        "text/plain",
        "text/html",
        "application/json",
        "application/pdf",
        "video/mp4",
        "audio/mpeg",
        "application/zip",
        "text/css",
        "application/javascript",
        "application/xml",
      ];

      nonImageTypes.forEach((mimeType) => {
        expect(isImage(mimeType)).toBe(false);
      });
    });

    it("should return false for image-like but unsupported MIME types", () => {
      const unsupportedImageTypes = [
        "image/tiff",
        "image/x-icon",
        "image/vnd.microsoft.icon",
        "image/svg+xml",
        "image/avif",
        "image/jxl",
      ];

      unsupportedImageTypes.forEach((mimeType) => {
        expect(isImage(mimeType)).toBe(false);
      });
    });

    it("should handle case sensitivity correctly", () => {
      // Test that the function is case-sensitive (as it should be for MIME types)
      expect(isImage("IMAGE/JPEG")).toBe(false);
      expect(isImage("image/Jpeg")).toBe(false);
      expect(isImage("Image/jpeg")).toBe(false);
      expect(isImage("image/jpeg")).toBe(true);
    });

    it("should handle empty string", () => {
      expect(isImage("")).toBe(false);
    });

    it("should handle null and undefined", () => {
      // TypeScript should prevent this, but let's test for robustness
      expect(isImage(null as unknown as string)).toBeFalsy();
      expect(isImage(undefined as unknown as string)).toBeFalsy();
    });

    it("should handle whitespace", () => {
      expect(isImage(" image/jpeg ")).toBe(false);
      expect(isImage("image/jpeg ")).toBe(false);
      expect(isImage(" image/jpeg")).toBe(false);
      expect(isImage("image/jpeg")).toBe(true);
    });

    it("should handle malformed MIME types", () => {
      const malformedTypes = [
        "image",
        "jpeg",
        "image/",
        "/jpeg",
        "image:jpeg",
        "image;jpeg",
        "image.jpeg",
        "image_jpeg",
      ];

      malformedTypes.forEach((mimeType) => {
        expect(isImage(mimeType)).toBe(false);
      });
    });

    it("should handle special characters in MIME types", () => {
      const specialCharTypes = [
        "image/jpeg;charset=utf-8",
        "image/png;base64",
        "image/gif;version=1",
        "image/webp;quality=0.8",
      ];

      specialCharTypes.forEach((mimeType) => {
        expect(isImage(mimeType)).toBe(false);
      });
    });

    it("should verify IMAGE_MIME_TYPES constant contains all expected types", () => {
      const expectedTypes = [
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

      expect(IMAGE_MIME_TYPES).toEqual(expectedTypes);
      expect(IMAGE_MIME_TYPES.length).toBe(19);
    });

    it("should handle very long MIME types", () => {
      const longMimeType = "image/" + "a".repeat(1000);
      expect(isImage(longMimeType)).toBe(false);
    });

    it("should handle MIME types with numbers", () => {
      const numericTypes = ["image/jpeg2000", "image/png1", "image/gif2", "image/webp3"];

      numericTypes.forEach((mimeType) => {
        expect(isImage(mimeType)).toBe(false);
      });
    });
  });

  describe("calculateChunkContentLength", () => {
    it("should return CHUNK_SIZE for non-last parts", () => {
      const totalSize = 16 * 1024 * 1024; // 16MB
      const isLastPart = false;

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(CHUNK_SIZE);
    });

    it("should return CHUNK_SIZE for last part when file size is exactly divisible by chunk size", () => {
      const totalSize = 16 * 1024 * 1024; // 16MB (exactly 2 chunks of 8MB)
      const isLastPart = true;

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(CHUNK_SIZE);
    });

    it("should return dangling size for last part when there is a remainder", () => {
      const totalSize = 10 * 1024 * 1024; // 10MB (1 full chunk + 2MB remainder)
      const isLastPart = true;
      const expectedDanglingSize = 2 * 1024 * 1024; // 2MB

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(expectedDanglingSize);
    });

    it("should handle file size smaller than chunk size", () => {
      const totalSize = 1 * 1024 * 1024; // 1MB
      const isLastPart = true;

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(totalSize); // Should return the full file size
    });

    it("should handle file size exactly equal to chunk size", () => {
      const totalSize = CHUNK_SIZE; // Exactly one chunk
      const isLastPart = true;

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(CHUNK_SIZE);
    });

    it("should handle custom chunk size", () => {
      const customChunkSize = 4 * 1024 * 1024; // 4MB
      const totalSize = 10 * 1024 * 1024; // 10MB
      const isLastPart = true;
      const expectedDanglingSize = 2 * 1024 * 1024; // 2MB remainder

      const result = calculateChunkContentLength(isLastPart, totalSize, customChunkSize);
      expect(result).toBe(expectedDanglingSize);
    });

    it("should handle zero file size", () => {
      const totalSize = 0;
      const isLastPart = true;

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(CHUNK_SIZE);
    });

    it("should handle very large file sizes", () => {
      const totalSize = 100 * 1024 * 1024; // 100MB
      const isLastPart = true;
      const expectedDanglingSize = 4 * 1024 * 1024; // 4MB remainder (100 % 8 = 4)

      const result = calculateChunkContentLength(isLastPart, totalSize);
      expect(result).toBe(expectedDanglingSize);
    });

    it("should handle edge case where remainder is exactly chunk size", () => {
      const totalSize = 16 * 1024 * 1024; // 16MB
      const customChunkSize = 4 * 1024 * 1024; // 4MB
      const isLastPart = true;

      const result = calculateChunkContentLength(isLastPart, totalSize, customChunkSize);
      expect(result).toBe(customChunkSize); // Should use chunk size, not 0
    });

    it("should work correctly for all parts in a multipart upload", () => {
      const totalSize = 20 * 1024 * 1024; // 20MB
      const partCount = Math.ceil(totalSize / CHUNK_SIZE); // 3 parts

      // Test each part
      for (let partNumber = 1; partNumber <= partCount; partNumber++) {
        const isLastPart = partNumber === partCount;
        const result = calculateChunkContentLength(isLastPart, totalSize);

        if (isLastPart) {
          // Last part should have 4MB (20 % 8 = 4)
          expect(result).toBe(4 * 1024 * 1024);
        } else {
          // Non-last parts should have full chunk size
          expect(result).toBe(CHUNK_SIZE);
        }
      }
    });

    it("should handle negative chunk size gracefully", () => {
      const totalSize = 10 * 1024 * 1024;
      const isLastPart = true;
      const negativeChunkSize = -8 * 1024 * 1024;

      // This should not throw and should handle the negative value
      expect(() =>
        calculateChunkContentLength(isLastPart, totalSize, negativeChunkSize),
      ).not.toThrow();
    });
  });
});

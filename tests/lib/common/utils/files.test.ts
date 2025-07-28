import { describe, it, expect } from "vitest";
import { isImage, IMAGE_MIME_TYPES } from "../../../../src/lib/common/utils/files";

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
        "image/bmp",
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
      expect(() => isImage(null as any)).toThrow();
      expect(() => isImage(undefined as any)).toThrow();
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
});

import { describe, it, expect } from "vitest";
import {
  hashFile,
  hashFileStream,
  hashFileFallback,
  hashFileSmart,
} from "../../../src/lib/client/utils/crypto";

describe("crypto utilities", () => {
  // Helper function to create a mock file
  function createMockFile(content: string, name: string = "test.txt"): File {
    const blob = new Blob([content], { type: "text/plain" });
    return new File([blob], name, { type: "text/plain" });
  }

  // Helper function to create a large mock file
  function createLargeMockFile(sizeInBytes: number, name: string = "large.txt"): File {
    const content = "a".repeat(sizeInBytes);
    return createMockFile(content, name);
  }

  describe("hashFile", () => {
    it("should hash a simple text file correctly", async () => {
      const file = createMockFile("Hello, World!");
      const hash = await hashFile(file);

      // SHA-256 hash of "Hello, World!"
      const expectedHash = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";
      expect(hash).toBe(expectedHash);
    });

    it("should hash an empty file correctly", async () => {
      const file = createMockFile("");
      const hash = await hashFile(file);

      // SHA-256 hash of empty string
      const expectedHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      expect(hash).toBe(expectedHash);
    });

    it("should produce consistent hashes for the same content", async () => {
      const file1 = createMockFile("Test content");
      const file2 = createMockFile("Test content");

      const hash1 = await hashFile(file1);
      const hash2 = await hashFile(file2);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different content", async () => {
      const file1 = createMockFile("Content 1");
      const file2 = createMockFile("Content 2");

      const hash1 = await hashFile(file1);
      const hash2 = await hashFile(file2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("hashFileStream", () => {
    it("should hash a file using streaming approach", async () => {
      const file = createMockFile("Hello, World!");
      const hash = await hashFileStream(file);

      // Should produce the same hash as the original method
      const expectedHash = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";
      expect(hash).toBe(expectedHash);
    });

    it("should call progress callback during processing", async () => {
      const file = createLargeMockFile(1024 * 1024); // 1MB file
      const progressCalls: number[] = [];

      const hash = await hashFileStream(file, (progress) => {
        progressCalls.push(progress);
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[0]).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1]).toBe(1.0);
      expect(hash).toBeTruthy();
    });

    it("should handle files without progress callback", async () => {
      const file = createMockFile("Test content");
      const hash = await hashFileStream(file);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64); // SHA-256 hex string length
    });

    it("should produce consistent results with original method", async () => {
      const content = "This is a test file with some content";
      const file = createMockFile(content);

      const originalHash = await hashFile(file);
      const streamHash = await hashFileStream(file);

      expect(streamHash).toBe(originalHash);
    });
  });

  describe("hashFileFallback", () => {
    it("should hash a file using fallback method", async () => {
      const file = createMockFile("Hello, World!");
      const hash = await hashFileFallback(file);

      // Should produce the same hash as the original method
      const expectedHash = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";
      expect(hash).toBe(expectedHash);
    });

    it("should call progress callback with 100% completion", async () => {
      const file = createMockFile("Test content");
      let progressValue = 0;

      const hash = await hashFileFallback(file, (progress) => {
        progressValue = progress;
      });

      expect(progressValue).toBe(1.0);
      expect(hash).toBeTruthy();
    });

    it("should handle files without progress callback", async () => {
      const file = createMockFile("Test content");
      const hash = await hashFileFallback(file);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });
  });

  describe("hashFileSmart", () => {
    it("should use original method for small files", async () => {
      const file = createMockFile("Small file content");
      const hash = await hashFileSmart(file);

      // Should produce the same hash as the original method
      const expectedHash = await hashFile(file);
      expect(hash).toBe(expectedHash);
    });

    it("should use streaming method for large files when supported", async () => {
      const file = createLargeMockFile(2 * 1024 * 1024); // 2MB file
      const progressCalls: number[] = [];

      const hash = await hashFileSmart(file, (progress) => {
        progressCalls.push(progress);
      });

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);

      // Should have called progress callback if streaming was used
      if (progressCalls.length > 0) {
        expect(progressCalls[0]).toBeGreaterThan(0);
        expect(progressCalls[progressCalls.length - 1]).toBe(1.0);
      }
    });

    it("should handle files without progress callback", async () => {
      const file = createMockFile("Test content");
      const hash = await hashFileSmart(file);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });

    it("should produce consistent results across all methods", async () => {
      const content = "Consistent test content";
      const file = createMockFile(content);

      const originalHash = await hashFile(file);
      const smartHash = await hashFileSmart(file);

      expect(smartHash).toBe(originalHash);
    });

    it("should handle edge case files around the threshold", async () => {
      // Test with a file exactly at the threshold (1MB)
      const file = createLargeMockFile(1024 * 1024);
      const hash = await hashFileSmart(file);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });
  });

  describe("error handling", () => {
    it("should handle corrupted files gracefully", async () => {
      // Create a file with invalid content
      const invalidBlob = new Blob([new ArrayBuffer(0)], { type: "text/plain" });
      const file = new File([invalidBlob], "corrupted.txt", { type: "text/plain" });

      // Should not throw an error
      const hash = await hashFile(file);
      expect(hash).toBeTruthy();
    });

    it("should handle very large files", async () => {
      // Test with a moderately large file (10MB)
      const file = createLargeMockFile(10 * 1024 * 1024);

      const startTime = Date.now();
      const hash = await hashFileSmart(file);
      const endTime = Date.now();

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);

      // Should complete within reasonable time (less than 10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe("performance characteristics", () => {
    it("should handle multiple concurrent hash operations", async () => {
      const files = Array.from({ length: 5 }, (_, i) => createMockFile(`Content for file ${i}`));

      const startTime = Date.now();
      const hashes = await Promise.all(files.map((file) => hashFileSmart(file)));
      const endTime = Date.now();

      expect(hashes).toHaveLength(5);
      hashes.forEach((hash) => {
        expect(hash).toBeTruthy();
        expect(hash.length).toBe(64);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

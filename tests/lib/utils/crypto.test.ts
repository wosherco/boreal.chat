import { describe, it, expect } from "vitest";
import {
  hashFile,
  hashFileStream,
  hashFileFallback,
  hashFileSmart,
  hashFileChunked,
  createS3ETag,
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

  // Helper function to chunk a file into 8MB pieces
  function chunkFile(file: File, chunkSize: number = 8 * 1024 * 1024): Blob[] {
    const chunks: Blob[] = [];
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }
    return chunks;
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

  describe("hashFileChunked", () => {
    it("should hash a small file as a single chunk", async () => {
      const file = createMockFile("Hello, World!");
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);

      expect(chunks).toHaveLength(1);
      expect(result.chunkHashes).toHaveLength(1);
      expect(result.chunkHashes[0]).toBeTruthy();
      expect(result.compositeHash).toBeTruthy();
    });

    it("should hash a large file in multiple chunks", async () => {
      // Create a file larger than 8MB (use 20MB)
      const file = createLargeMockFile(20 * 1024 * 1024);
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);

      expect(chunks).toHaveLength(3); // 20MB / 8MB = 2.5, rounded up to 3
      expect(result.chunkHashes).toHaveLength(3);

      // All chunk hashes should be valid
      result.chunkHashes.forEach((hash) => {
        expect(hash).toBeTruthy();
        expect(hash.length).toBe(64); // SHA-256 hex string length
      });

      expect(result.compositeHash).toBeTruthy();
      expect(result.compositeHash.length).toBe(64);
    });

    it("should call progress callback", async () => {
      const file = createLargeMockFile(10 * 1024 * 1024); // 10MB
      const chunks = chunkFile(file);
      let progressCalled = false;
      let finalProgress = 0;

      const result = await hashFileChunked(chunks, (progress) => {
        progressCalled = true;
        finalProgress = progress;
      });

      expect(progressCalled).toBe(true);
      expect(finalProgress).toBe(1.0);
      expect(result).toBeTruthy();
    });

    it("should work without progress callback", async () => {
      const file = createMockFile("Test content");
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);

      expect(result).toBeTruthy();
      expect(chunks).toHaveLength(1);
      expect(result.chunkHashes).toHaveLength(1);
    });

    it("should produce consistent results for the same file", async () => {
      const file = createMockFile("Consistent test content");
      const chunks1 = chunkFile(file);
      const chunks2 = chunkFile(file);

      const result1 = await hashFileChunked(chunks1);
      const result2 = await hashFileChunked(chunks2);

      expect(result1.chunkHashes).toEqual(result2.chunkHashes);
      expect(result1.compositeHash).toBe(result2.compositeHash);
    });

    it("should handle files exactly at chunk boundary", async () => {
      // Create a file exactly 8MB
      const file = createLargeMockFile(8 * 1024 * 1024);
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);

      expect(chunks).toHaveLength(1);
      expect(result.chunkHashes).toHaveLength(1);
    });

    it("should handle files just over chunk boundary", async () => {
      // Create a file just over 8MB
      const file = createLargeMockFile(8 * 1024 * 1024 + 1);
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);

      expect(chunks).toHaveLength(2);
      expect(result.chunkHashes).toHaveLength(2);
    });

    it("should handle empty files", async () => {
      const file = createMockFile("");
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);

      expect(chunks).toHaveLength(0);
      expect(result.chunkHashes).toHaveLength(0);

      // Composite hash of empty chunks should still be valid
      expect(result.compositeHash).toBeTruthy();
      expect(result.compositeHash.length).toBe(64);
    });

    it("should produce different composite hashes for different files", async () => {
      const file1 = createMockFile("File content 1");
      const file2 = createMockFile("File content 2");

      const chunks1 = chunkFile(file1);
      const chunks2 = chunkFile(file2);

      const result1 = await hashFileChunked(chunks1);
      const result2 = await hashFileChunked(chunks2);

      expect(result1.compositeHash).not.toBe(result2.compositeHash);
      expect(result1.chunkHashes[0]).not.toBe(result2.chunkHashes[0]);
    });

    it("should be performant for large files", async () => {
      // Test with moderately large file (25MB = 4 chunks)
      const file = createLargeMockFile(25 * 1024 * 1024);
      const chunks = chunkFile(file);

      const startTime = Date.now();
      const result = await hashFileChunked(chunks);
      const endTime = Date.now();

      expect(chunks).toHaveLength(4);
      expect(result.chunkHashes).toHaveLength(4);

      // Should complete within reasonable time (parallel processing should be fast)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe("createS3ETag", () => {
    it("should create proper S3-style ETag for single chunk", async () => {
      const file = createMockFile("Small file");
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);
      const etag = createS3ETag({ ...result, totalChunks: chunks.length });

      expect(etag).toBe(`${result.compositeHash}-1`);
      expect(etag).toMatch(/^[a-f0-9]{64}-1$/);
    });

    it("should create proper S3-style ETag for multiple chunks", async () => {
      const file = createLargeMockFile(20 * 1024 * 1024); // 20MB = 3 chunks
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);
      const etag = createS3ETag({ ...result, totalChunks: chunks.length });

      expect(etag).toBe(`${result.compositeHash}-3`);
      expect(etag).toMatch(/^[a-f0-9]{64}-3$/);
    });

    it("should handle zero chunks gracefully", async () => {
      const file = createMockFile("");
      const chunks = chunkFile(file);
      const result = await hashFileChunked(chunks);
      const etag = createS3ETag({ ...result, totalChunks: chunks.length });

      expect(etag).toBe(`${result.compositeHash}-0`);
      expect(etag).toMatch(/^[a-f0-9]{64}-0$/);
    });

    it("should produce consistent ETags for the same file", async () => {
      const file = createMockFile("Consistent content");
      const chunks1 = chunkFile(file);
      const chunks2 = chunkFile(file);

      const result1 = await hashFileChunked(chunks1);
      const result2 = await hashFileChunked(chunks2);

      const etag1 = createS3ETag({ ...result1, totalChunks: chunks1.length });
      const etag2 = createS3ETag({ ...result2, totalChunks: chunks2.length });

      expect(etag1).toBe(etag2);
    });

    it("should produce different ETags for different files", async () => {
      const file1 = createMockFile("Content 1");
      const file2 = createMockFile("Content 2");

      const chunks1 = chunkFile(file1);
      const chunks2 = chunkFile(file2);

      const result1 = await hashFileChunked(chunks1);
      const result2 = await hashFileChunked(chunks2);

      const etag1 = createS3ETag({ ...result1, totalChunks: chunks1.length });
      const etag2 = createS3ETag({ ...result2, totalChunks: chunks2.length });

      expect(etag1).not.toBe(etag2);
    });
  });
});

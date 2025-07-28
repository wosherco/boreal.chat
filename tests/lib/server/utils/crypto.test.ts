import { describe, it, expect } from "vitest";
import { Readable } from "stream";
import { generateStreamHash } from "../../../../src/lib/server/utils/crypto";

describe("server crypto utilities", () => {
  describe("generateStreamHash", () => {
    it("should generate SHA-512 hash from a simple string stream", async () => {
      const content = "Hello, World!";
      const stream = Readable.from([Buffer.from(content)]);

      const hash = await generateStreamHash(stream);

      // SHA-512 hash of "Hello, World!"
      const expectedHash =
        "374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387";
      expect(hash).toBe(expectedHash);
    });

    it("should generate SHA-256 hash when algorithm is specified", async () => {
      const content = "Hello, World!";
      const stream = Readable.from([Buffer.from(content)]);

      const hash = await generateStreamHash(stream, "sha256");

      // SHA-256 hash of "Hello, World!"
      const expectedHash = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";
      expect(hash).toBe(expectedHash);
    });

    it("should handle empty stream", async () => {
      const stream = Readable.from([]);

      const hash = await generateStreamHash(stream);

      // SHA-512 hash of empty string
      const expectedHash =
        "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e";
      expect(hash).toBe(expectedHash);
    });

    it("should handle large data streams", async () => {
      const largeContent = "a".repeat(1024 * 1024); // 1MB of data
      const stream = Readable.from([Buffer.from(largeContent)]);

      const hash = await generateStreamHash(stream);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(128); // SHA-512 hex string length
    });

    it("should handle multiple chunks in stream", async () => {
      const chunks = [
        Buffer.from("Hello, "),
        Buffer.from("World!"),
        Buffer.from(" This is a test."),
      ];
      const stream = Readable.from(chunks);

      const hash = await generateStreamHash(stream);

      // Should be the same as hashing the concatenated string
      const fullContent = "Hello, World! This is a test.";
      const expectedStream = Readable.from([Buffer.from(fullContent)]);
      const expectedHash = await generateStreamHash(expectedStream);

      expect(hash).toBe(expectedHash);
    });

    it("should produce consistent hashes for the same content", async () => {
      const content = "Test content for consistency";
      const stream1 = Readable.from([Buffer.from(content)]);
      const stream2 = Readable.from([Buffer.from(content)]);

      const hash1 = await generateStreamHash(stream1);
      const hash2 = await generateStreamHash(stream2);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different content", async () => {
      const stream1 = Readable.from([Buffer.from("Content 1")]);
      const stream2 = Readable.from([Buffer.from("Content 2")]);

      const hash1 = await generateStreamHash(stream1);
      const hash2 = await generateStreamHash(stream2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle binary data", async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]);
      const stream = Readable.from([binaryData]);

      const hash = await generateStreamHash(stream);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(128);
    });

    it("should handle unicode content", async () => {
      const unicodeContent = "Hello, 世界! 🌍";
      const stream = Readable.from([Buffer.from(unicodeContent, "utf8")]);

      const hash = await generateStreamHash(stream);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(128);
    });

    it("should handle stream errors gracefully", async () => {
      const stream = new Readable({
        read() {
          this.emit("error", new Error("Test error"));
        },
      });

      await expect(generateStreamHash(stream)).rejects.toThrow("Test error");
    });

    it("should handle slow streaming data", async () => {
      const content = "Slow streaming test content";
      const chunks = content.split("").map((char) => Buffer.from(char));

      const stream = new Readable({
        read() {
          if (chunks.length > 0) {
            this.push(chunks.shift());
          } else {
            this.push(null);
          }
        },
      });

      const hash = await generateStreamHash(stream);

      // Should be the same as hashing the full content at once
      const expectedStream = Readable.from([Buffer.from(content)]);
      const expectedHash = await generateStreamHash(expectedStream);

      expect(hash).toBe(expectedHash);
    });

    it("should work with both SHA-512 and SHA-256 algorithms", async () => {
      const content = "Algorithm test content";
      const stream1 = Readable.from([Buffer.from(content)]);
      const stream2 = Readable.from([Buffer.from(content)]);

      const sha512Hash = await generateStreamHash(stream1, "sha512");
      const sha256Hash = await generateStreamHash(stream2, "sha256");

      expect(sha512Hash.length).toBe(128); // SHA-512 hex string length
      expect(sha256Hash.length).toBe(64); // SHA-256 hex string length
      expect(sha512Hash).not.toBe(sha256Hash);
    });

    it("should handle very large streams efficiently", async () => {
      const largeContent = "x".repeat(5 * 1024 * 1024); // 5MB of data
      const stream = Readable.from([Buffer.from(largeContent)]);

      const startTime = Date.now();
      const hash = await generateStreamHash(stream);
      const endTime = Date.now();

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(128);

      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should handle concurrent hash operations", async () => {
      const contents = ["Content 1", "Content 2", "Content 3", "Content 4", "Content 5"];

      const streams = contents.map((content) => Readable.from([Buffer.from(content)]));

      const hashes = await Promise.all(streams.map((stream) => generateStreamHash(stream)));

      expect(hashes).toHaveLength(5);
      hashes.forEach((hash) => {
        expect(hash).toBeTruthy();
        expect(hash.length).toBe(128);
      });

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);
    });
  });
});

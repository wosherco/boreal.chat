import { createHash } from "node:crypto";
import type { Readable } from "stream";

/**
 * Generates a SHA-512 hash from a stream
 * @param stream - The readable stream to hash
 * @returns Promise that resolves to the final hash as a hex string
 */
export async function generateStreamHash(
  stream: Readable,
  algorithm: "sha512" | "sha256" = "sha512",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm);

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("end", () => {
      const finalHash = hash.digest("hex");
      resolve(finalHash);
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

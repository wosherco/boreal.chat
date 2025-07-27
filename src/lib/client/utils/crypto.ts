/**
 * Simple file hashing that uses the arrayBuffer approach.
 * This is the fallback method for browsers that don't support streaming crypto operations.
 */
export async function hashFile(file: File) {
  const content = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", content);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Stream-based file hashing that processes files in chunks to avoid blocking the main thread.
 * This is more performant for large files and provides progress feedback.
 * Note: This uses a chunked approach but still loads chunks into memory.
 * For true streaming, we'd need a Web Crypto API that supports incremental hashing.
 */
export async function hashFileStream(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const totalSize = file.size;
  let processedBytes = 0;

  // Process file in chunks
  const reader = file.stream().getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);

      // Update progress
      processedBytes += value.length;
      if (onProgress) {
        onProgress(processedBytes / totalSize);
      }
    }

    // Combine all chunks and hash
    const combinedLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(combinedLength);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const hash = await crypto.subtle.digest("SHA-256", combined);

    // Convert to hex string
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fallback implementation for browsers that don't support streaming crypto operations.
 * Uses the original arrayBuffer approach but with progress feedback.
 */
export async function hashFileFallback(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const content = await file.arrayBuffer();

  if (onProgress) {
    onProgress(1.0); // 100% complete
  }

  const hash = await crypto.subtle.digest("SHA-256", content);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Smart file hashing that chooses the best method based on file size and browser support.
 * For small files (< 1MB), uses the simple approach.
 * For large files, uses streaming if supported, otherwise falls back to the original method.
 */
export async function hashFileSmart(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const LARGE_FILE_THRESHOLD = 1024 * 1024; // 1MB

  // For small files, use the simple approach
  if (file.size < LARGE_FILE_THRESHOLD) {
    return hashFile(file);
  }

  // For large files, try streaming first
  try {
    // Check if file streaming is supported
    if (typeof file.stream === "function") {
      return await hashFileStream(file, onProgress);
    } else {
      return await hashFileFallback(file, onProgress);
    }
  } catch (error) {
    // Fallback to original method if streaming fails
    console.warn("Streaming hash failed, falling back to arrayBuffer method:", error);
    return await hashFileFallback(file, onProgress);
  }
}

/**
 * Hash a file in chunks for S3 composite hashes.
 * Splits the file into 8MB chunks, calculates SHA-256 hash for each chunk using existing methods,
 * and creates a composite hash similar to S3's multipart upload ETags.
 *
 * @param file - The file to hash
 * @param onProgress - Optional progress callback (0-1)
 * @returns Object containing chunk hashes, composite hash, and metadata
 */
export async function hashFileChunked(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{
  chunkHashes: string[];
  compositeHash: string;
  totalChunks: number;
  chunkSize: number;
  fileSize: number;
}> {
  const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const chunkHashes: string[] = [];

  // Hash chunks in parallel for better performance
  const chunkPromises = [];

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);

    // Create a File object from the chunk to leverage existing hash methods
    const chunkBlob = file.slice(start, end);
    const chunkFile = new File([chunkBlob], `chunk-${chunkIndex}`, { type: file.type });

    // Use the existing smart hashing method for optimal performance
    chunkPromises.push(hashFileSmart(chunkFile));
  }

  // Wait for all chunks to be hashed
  const results = await Promise.all(chunkPromises);
  chunkHashes.push(...results);

  // Report progress as complete
  if (onProgress) {
    onProgress(1.0);
  }

  // Create composite hash from chunk hashes
  // Convert hex strings to bytes and concatenate them
  const hashBytes = chunkHashes.flatMap((hash) => {
    const bytes = [];
    for (let i = 0; i < hash.length; i += 2) {
      bytes.push(parseInt(hash.substr(i, 2), 16));
    }
    return bytes;
  });

  const concatenatedHashes = new Uint8Array(hashBytes);

  // Hash the concatenated chunk hashes using existing method
  const compositeFile = new File([concatenatedHashes], "composite-hash");
  const compositeHash = await hashFile(compositeFile);

  return {
    chunkHashes,
    compositeHash,
    totalChunks,
    chunkSize: CHUNK_SIZE,
    fileSize: file.size,
  };
}

/**
 * Create an S3-style ETag from chunked hash results.
 * Returns a string in the format "compositeHash-numberOfChunks"
 *
 * @param result - Result from hashFileChunked
 * @returns S3-style ETag string
 */
export function createS3ETag(result: { compositeHash: string; totalChunks: number }): string {
  return `${result.compositeHash}-${result.totalChunks}`;
}

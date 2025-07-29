/**
 * Simple file hashing that uses the arrayBuffer approach.
 * This is the fallback method for browsers that don't support streaming crypto operations.
 */
export async function hashFile(file: File | Blob) {
  const content = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-512", content);
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
  file: File | Blob,
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

    const hash = await crypto.subtle.digest("SHA-512", combined);

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
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const content = await file.arrayBuffer();

  if (onProgress) {
    onProgress(1.0); // 100% complete
  }

  const hash = await crypto.subtle.digest("SHA-512", content);
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
  file: File | Blob,
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

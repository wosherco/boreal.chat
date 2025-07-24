import { getMCPFetch, getProxyInfo } from "./proxiedFetch";

// Store the original global fetch
const originalFetch = global.fetch;
let mcpFetchPatched = false;

/**
 * Patch the global fetch for MCP operations
 * This ensures all HTTP requests made by MCP clients go through our proxy/security controls
 */
export function patchGlobalFetchForMCP() {
  if (mcpFetchPatched) {
    return; // Already patched
  }

  const mcpFetch = getMCPFetch();
  const proxyInfo = getProxyInfo();

  // Only patch if we have security controls enabled
  if (proxyInfo.enabled || proxyInfo.allowedDomains.length > 0) {
    console.log("Patching global fetch for MCP operations with proxy controls:", proxyInfo);
    
    // Replace global fetch with our proxied version
    global.fetch = mcpFetch as any;
    mcpFetchPatched = true;
  }
}

/**
 * Restore the original global fetch
 * Useful for cleanup or testing
 */
export function restoreGlobalFetch() {
  if (mcpFetchPatched) {
    global.fetch = originalFetch;
    mcpFetchPatched = false;
    console.log("Restored original global fetch");
  }
}

/**
 * Get the status of global fetch patching
 */
export function getMCPFetchPatchStatus() {
  return {
    patched: mcpFetchPatched,
    proxyInfo: getProxyInfo(),
  };
}

/**
 * Execute a function with MCP fetch patching temporarily enabled
 * Useful for running MCP operations with proxy controls
 */
export async function withMCPFetch<T>(fn: () => Promise<T>): Promise<T> {
  const wasPatched = mcpFetchPatched;
  
  if (!wasPatched) {
    patchGlobalFetchForMCP();
  }
  
  try {
    return await fn();
  } finally {
    if (!wasPatched) {
      restoreGlobalFetch();
    }
  }
}
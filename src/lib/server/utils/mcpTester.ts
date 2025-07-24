import type { MCPServer } from "$lib/server/db/schema";
import { withMCPFetch } from "./mcpGlobalFetch";
import { getMCPFetch, getProxyInfo } from "./proxiedFetch";

export interface MCPConnectionTestResult {
  success: boolean;
  error?: string;
  details: {
    transport: string;
    proxyUsed: boolean;
    responseTime: number;
    allowedDomain: boolean;
  };
}

/**
 * Test MCP server connection with proxy settings
 */
export async function testMCPConnection(mcpServer: MCPServer): Promise<MCPConnectionTestResult> {
  const startTime = Date.now();
  const proxyInfo = getProxyInfo();

  try {
    if (mcpServer.transport === "stdio") {
      // For stdio transport, we can't test network connectivity
      // but we can validate the command and args
      if (!mcpServer.command || !mcpServer.args || (mcpServer.args as any[]).length === 0) {
        return {
          success: false,
          error: "Invalid stdio configuration: missing command or args",
          details: {
            transport: "stdio",
            proxyUsed: false,
            responseTime: Date.now() - startTime,
            allowedDomain: true, // Not applicable for stdio
          },
        };
      }

      return {
        success: true,
        details: {
          transport: "stdio",
          proxyUsed: false,
          responseTime: Date.now() - startTime,
          allowedDomain: true,
        },
      };
    } else if (mcpServer.transport === "streamable_http") {
      if (!mcpServer.url) {
        return {
          success: false,
          error: "Invalid HTTP configuration: missing URL",
          details: {
            transport: "streamable_http",
            proxyUsed: proxyInfo.enabled,
            responseTime: Date.now() - startTime,
            allowedDomain: false,
          },
        };
      }

      // Test HTTP connectivity using our proxied fetch
      return await withMCPFetch(async () => {
        try {
          const mcpFetch = getMCPFetch();
          
          // Try to make a simple HEAD request to test connectivity
          const response = await mcpFetch(mcpServer.url!, {
            method: "HEAD",
          } as any);

          return {
            success: response.ok || response.status < 500, // Accept non-5xx responses as "reachable"
            error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
            details: {
              transport: "streamable_http",
              proxyUsed: proxyInfo.enabled,
              responseTime: Date.now() - startTime,
              allowedDomain: true, // If we got here, domain was allowed
            },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          return {
            success: false,
            error: errorMessage,
            details: {
              transport: "streamable_http",
              proxyUsed: proxyInfo.enabled,
              responseTime: Date.now() - startTime,
              allowedDomain: !errorMessage.includes("not allowed"),
            },
          };
        }
      });
    } else {
      return {
        success: false,
        error: `Unsupported transport: ${mcpServer.transport}`,
        details: {
          transport: mcpServer.transport,
          proxyUsed: false,
          responseTime: Date.now() - startTime,
          allowedDomain: false,
        },
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: errorMessage,
      details: {
        transport: mcpServer.transport,
        proxyUsed: proxyInfo.enabled,
        responseTime: Date.now() - startTime,
        allowedDomain: !errorMessage.includes("not allowed"),
      },
    };
  }
}

/**
 * Test multiple MCP servers in parallel
 */
export async function testMCPConnections(mcpServers: MCPServer[]): Promise<Record<string, MCPConnectionTestResult>> {
  const results: Record<string, MCPConnectionTestResult> = {};
  
  // Test all servers in parallel with a reasonable concurrency limit
  const concurrency = Math.min(3, mcpServers.length);
  const chunks = [];
  
  for (let i = 0; i < mcpServers.length; i += concurrency) {
    chunks.push(mcpServers.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(async (server) => ({
        id: server.id,
        result: await testMCPConnection(server),
      }))
    );
    
    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results[result.value.id] = result.value.result;
      } else {
        const rejectedValue = result as any;
        results[rejectedValue.value?.id || 'unknown'] = {
          success: false,
          error: `Test failed: ${result.reason}`,
          details: {
            transport: 'unknown',
            proxyUsed: false,
            responseTime: 0,
            allowedDomain: false,
          },
        };
      }
    }
  }
  
  return results;
}
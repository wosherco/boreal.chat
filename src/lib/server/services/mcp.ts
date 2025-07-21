import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { MCPServer } from "$lib/server/db/schema";
import type { Tool } from "@langchain/core/tools";

export class MCPService {
  private clients = new Map<string, MultiServerMCPClient>();

  async getTools(mcpServer: MCPServer): Promise<Tool[]> {
    try {
      const client = await this.getOrCreateClient(mcpServer);
      const tools = await client.get_tools();
      return tools;
    } catch (error) {
      console.error(`Failed to get tools from MCP server ${mcpServer.name}:`, error);
      return [];
    }
  }

  private async getOrCreateClient(mcpServer: MCPServer): Promise<MultiServerMCPClient> {
    const cacheKey = mcpServer.id;
    
    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    const connection = this.buildConnection(mcpServer);
    const client = new MultiServerMCPClient({
      [mcpServer.name]: connection,
    });

    this.clients.set(cacheKey, client);
    return client;
  }

  private buildConnection(mcpServer: MCPServer) {
    if (mcpServer.transport === "stdio") {
      if (!mcpServer.command || !mcpServer.args) {
        throw new Error("stdio transport requires command and args");
      }
      
      return {
        command: mcpServer.command,
        args: mcpServer.args as string[],
        transport: "stdio" as const,
      };
    } else if (mcpServer.transport === "streamable_http") {
      if (!mcpServer.url) {
        throw new Error("streamable_http transport requires url");
      }
      
      return {
        url: mcpServer.url,
        transport: "streamable_http" as const,
      };
    } else {
      throw new Error(`Unsupported transport: ${mcpServer.transport}`);
    }
  }

  async executeToolWithConfirmation(
    mcpServer: MCPServer,
    toolName: string,
    toolArgs: Record<string, any>
  ): Promise<{ 
    toolResult?: any; 
    needsConfirmation: boolean; 
    confirmationMessage?: string 
  }> {
    try {
      const tools = await this.getTools(mcpServer);
      const tool = tools.find(t => t.name === toolName);
      
      if (!tool) {
        throw new Error(`Tool ${toolName} not found in MCP server ${mcpServer.name}`);
      }

      // For now, all MCP tools require confirmation
      // In the future, we could add configuration to bypass confirmation for certain tools
      return {
        needsConfirmation: true,
        confirmationMessage: `Do you want to execute the MCP tool "${toolName}" with arguments: ${JSON.stringify(toolArgs, null, 2)}?`,
      };
    } catch (error) {
      console.error(`Failed to prepare MCP tool execution:`, error);
      throw error;
    }
  }

  async executeConfirmedTool(
    mcpServer: MCPServer,
    toolName: string,
    toolArgs: Record<string, any>
  ): Promise<any> {
    try {
      const tools = await this.getTools(mcpServer);
      const tool = tools.find(t => t.name === toolName);
      
      if (!tool) {
        throw new Error(`Tool ${toolName} not found in MCP server ${mcpServer.name}`);
      }

      const result = await tool.invoke(toolArgs);
      return result;
    } catch (error) {
      console.error(`Failed to execute MCP tool:`, error);
      throw error;
    }
  }

  // Clean up connections when done
  cleanup(mcpServerId: string) {
    this.clients.delete(mcpServerId);
  }
}

export const mcpService = new MCPService();
import { z } from "zod";
import { db } from "$lib/server/db";
import { mcpServerTable } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { getProxyInfo } from "../../utils/proxiedFetch";
import { testMCPConnection } from "../../utils/mcpTester";

const createMCPServerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  url: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  transport: z.enum(["stdio", "streamable_http"]),
  apiKey: z.string().optional(),
  authMethod: z.enum(["api_key", "none"]).default("api_key"),
  enabled: z.boolean().default(true),
});

const updateMCPServerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  transport: z.enum(["stdio", "streamable_http"]).optional(),
  apiKey: z.string().optional(),
  authMethod: z.enum(["api_key", "none"]).optional(),
  enabled: z.boolean().optional(),
});

export const v1MCPRouter = osBase.router({
    list: osBase
      .use(authenticatedMiddleware)
      .handler(async ({ context }) => {
        const mcpServers = await db
          .select({
            id: mcpServerTable.id,
            name: mcpServerTable.name,
            description: mcpServerTable.description,
            url: mcpServerTable.url,
            command: mcpServerTable.command,
            args: mcpServerTable.args,
            transport: mcpServerTable.transport,
            authMethod: mcpServerTable.authMethod,
            enabled: mcpServerTable.enabled,
            createdAt: mcpServerTable.createdAt,
            updatedAt: mcpServerTable.updatedAt,
          })
          .from(mcpServerTable)
          .where(eq(mcpServerTable.userId, context.userCtx.user.id));

        return mcpServers.map(server => ({
          ...server,
          args: server.args as string[] | null,
        }));
      }),

    create: osBase
      .use(authenticatedMiddleware)
      .input(createMCPServerSchema)
      .handler(async ({ input, context }) => {

        // Validate transport-specific requirements
        if (input.transport === "stdio" && (!input.command || !input.args)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "stdio transport requires command and args",
          });
        }

        if (input.transport === "streamable_http" && !input.url) {
          throw new ORPCError("BAD_REQUEST", {
            message: "streamable_http transport requires url",
          });
        }

        const [result] = await db
          .insert(mcpServerTable)
          .values({
            userId: context.userCtx.user.id,
            name: input.name,
            description: input.description,
            url: input.url,
            command: input.command,
            args: input.args,
            transport: input.transport,
            apiKey: input.apiKey, // TODO: encrypt this
            authMethod: input.authMethod,
            enabled: input.enabled,
          })
          .returning({ id: mcpServerTable.id });

        return { id: result.id };
      }),

    update: osBase
      .use(authenticatedMiddleware)
      .input(updateMCPServerSchema)
      .handler(async ({ input, context }) => {

        const { id, ...updateData } = input;

        // Check if server exists and belongs to user
        const existingServer = await db
          .select()
          .from(mcpServerTable)
          .where(and(eq(mcpServerTable.id, id), eq(mcpServerTable.userId, context.userCtx.user.id)))
          .limit(1);

        if (existingServer.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "MCP server not found",
          });
        }

        await db
          .update(mcpServerTable)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(and(eq(mcpServerTable.id, id), eq(mcpServerTable.userId, context.userCtx.user.id)));

        return { success: true };
      }),

    delete: osBase
      .use(authenticatedMiddleware)
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {

        // Check if server exists and belongs to user
        const existingServer = await db
          .select()
          .from(mcpServerTable)
          .where(and(eq(mcpServerTable.id, input.id), eq(mcpServerTable.userId, context.userCtx.user.id)))
          .limit(1);

        if (existingServer.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "MCP server not found",
          });
        }

        await db
          .delete(mcpServerTable)
          .where(and(eq(mcpServerTable.id, input.id), eq(mcpServerTable.userId, context.userCtx.user.id)));

        return { success: true };
      }),

    getById: osBase
      .use(authenticatedMiddleware)
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {

        const [server] = await db
          .select({
            id: mcpServerTable.id,
            name: mcpServerTable.name,
            description: mcpServerTable.description,
            url: mcpServerTable.url,
            command: mcpServerTable.command,
            args: mcpServerTable.args,
            transport: mcpServerTable.transport,
            authMethod: mcpServerTable.authMethod,
            enabled: mcpServerTable.enabled,
            createdAt: mcpServerTable.createdAt,
            updatedAt: mcpServerTable.updatedAt,
          })
          .from(mcpServerTable)
          .where(and(eq(mcpServerTable.id, input.id), eq(mcpServerTable.userId, context.userCtx.user.id)))
          .limit(1);

        if (!server) {
          return null;
        }

        return {
          ...server,
          args: server.args as string[] | null,
        };
      }),

    confirmTool: osBase
      .use(authenticatedMiddleware)
      .input(z.object({ 
        messageId: z.string().uuid(),
        confirmed: z.boolean(),
      }))
      .handler(async ({ input, context }) => {

        // This will be handled by the chat AI service
        // For now, just return success to indicate the endpoint exists
        return { success: true };
      }),

    proxyStatus: osBase
      .use(authenticatedMiddleware)
      .handler(async ({ context }) => {
        return getProxyInfo();
      }),

    testConnection: osBase
      .use(authenticatedMiddleware)
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        // Get the MCP server
        const [server] = await db
          .select()
          .from(mcpServerTable)
          .where(and(eq(mcpServerTable.id, input.id), eq(mcpServerTable.userId, context.userCtx.user.id)))
          .limit(1);

        if (!server) {
          throw new ORPCError("NOT_FOUND", {
            message: "MCP server not found",
          });
        }

        const testResult = await testMCPConnection(server);
        return testResult;
      }),
  });
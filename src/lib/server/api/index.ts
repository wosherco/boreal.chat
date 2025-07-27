import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { sessionCookieName, validateSessionToken } from "../auth";
import type { Session, User } from "../db/schema";
import { env } from "$env/dynamic/private";
import { cors } from "hono/cors";
import { appRouter } from "$lib/server/orpc/router";
import { RPCHandler } from "@orpc/server/fetch";
import type { StatusCode } from "hono/utils/http-status";
import type { Cookies } from "@sveltejs/kit";
import { handleStripeWebhook } from "../stripe";
import * as Sentry from "@sentry/sveltekit";

export interface UserContext {
  user: User | null;
  session: Session | null;
}

export interface CreateApiParams {
  ctx?: ExecutionContext;
  cookies?: Cookies;
  setHeaders?: (headers: Record<string, string>) => void;
}

export function createApi({ ctx, cookies, setHeaders }: CreateApiParams = {}) {
  const api = new Hono<{
    Bindings: object;
    Variables: { userCtx: UserContext; ctx?: ExecutionContext };
  }>();

  api.post("/api/webhook/stripe", (c) => {
    return handleStripeWebhook(c.req.raw);
  });

  api.post("/api/webhook/s3", async (c) => {
    try {
      const payload = await c.req.json();

      // Log the S3 event for debugging
      console.log("S3 Webhook received:", JSON.stringify(payload, null, 2));

      // Handle different S3 event types
      if (payload.Records && Array.isArray(payload.Records)) {
        for (const record of payload.Records) {
          const eventName = record.eventName;
          const bucketName = record.s3?.bucket?.name;
          const objectKey = record.s3?.object?.key;
          const objectSize = record.s3?.object?.size;

          console.log(
            `S3 Event: ${eventName} - Bucket: ${bucketName}, Object: ${objectKey}, Size: ${objectSize}`,
          );

          // You can add specific handling logic here based on the event type
          if (eventName?.startsWith("s3:ObjectCreated:")) {
            // Handle file upload events
            console.log(`File uploaded: ${objectKey} (${objectSize} bytes)`);

            // TODO: Add your custom logic here
            // For example:
            // - Update database with file metadata
            // - Trigger post-processing
            // - Send notifications to users
            // - etc.
          }
        }
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Error processing S3 webhook:", error);
      return c.json({ error: "Failed to process webhook" }, 500);
    }
  });

  api.use(
    "*",
    cors({
      origin: env.PUBLIC_ENVIRONMENT === "development" ? "*" : (env.PUBLIC_URL ?? "*"),
      allowHeaders: ["Authorization", "Content-Type", "Cookie"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
    async (c, next) => {
      let sessionToken: string | undefined = undefined;
      const sessionCookie = getCookie(c, sessionCookieName);

      if (sessionCookie) {
        sessionToken = sessionCookie;
      } else {
        const authHeader = c.req.header("Authorization");
        if (authHeader) {
          sessionToken = authHeader.split(" ")[1];
        }
      }

      c.set("ctx", ctx);
      c.set("userCtx", { session: null, user: null });

      if (sessionToken) {
        const { session, user } = await validateSessionToken(sessionToken);

        c.set("userCtx", { session, user });
      }

      await next();
      if (c.error) {
        console.error("Error: ", c.error);
        Sentry.captureException(c.error);
      }
    },
  );

  api.use("/api/v1/shape", async (c) => {
    const user = c.get("userCtx").user;

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const shapePathname = c.req.path.replace("/api", "");

    const electricSqlUrl = new URL(env.ELECTRIC_SQL_URL!);
    electricSqlUrl.pathname = shapePathname;

    // Cloning search params
    new URL(c.req.url).searchParams.forEach((value, key) => {
      electricSqlUrl.searchParams.set(key, value);
    });

    electricSqlUrl.searchParams.set(
      "where",
      `${electricSqlUrl.searchParams.get("table") === "user" ? "id" : "user_id"} = $1`,
    );
    electricSqlUrl.searchParams.set("params[1]", user.id);

    const electricHeaders = new Headers();

    if (env.ELECTRIC_SQL_SECRET) {
      electricHeaders.set("Authorization", `Bearer ${env.ELECTRIC_SQL_SECRET}`);
    } else {
      electricHeaders.delete("Authorization");
    }

    const electricRes = await fetch(electricSqlUrl.href, {
      headers: electricHeaders,
    });

    // Fetch decompresses the body but doesn't remove the
    // content-encoding & content-length headers which would
    // break decoding in the browser.
    //
    // See https://github.com/whatwg/fetch/issues/1729
    const headers = new Headers(electricRes.headers);
    headers.delete(`content-encoding`);
    headers.delete(`content-length`);

    return c.newResponse(
      electricRes.body,
      electricRes.status as StatusCode,
      Object.fromEntries(headers.entries()),
    );
  });

  const handler = new RPCHandler(appRouter);

  api.use("/api/rpc/*", async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: "/api/rpc",
      context: {
        headers: c.req.raw.headers,
        userCtx: c.get("userCtx"),
        ctx: c.get("ctx"),
        cookies,
        setHeaders,
      },
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    await next();
  });

  return api;
}

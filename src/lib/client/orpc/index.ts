import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { appRouter } from "$lib/server/orpc/router";
import { env } from "$env/dynamic/public";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new RPCLink({
  url: `${env.PUBLIC_URL}/api/rpc`,
  // headers: () => ({
  //   authorization: 'Bearer token',
  // }),
  // fetch: <-- provide fetch polyfill fetch if needed
});

// Create a client for your router
export const orpc: RouterClient<typeof appRouter> = createORPCClient(link);
export const orpcQuery = createTanstackQueryUtils(orpc);

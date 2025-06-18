import { createApi } from "$lib/server/api";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ request, platform, cookies }) =>
  createApi({ ctx: platform?.ctx, cookies }).fetch(request);
export const POST: RequestHandler = ({ request, platform, cookies }) =>
  createApi({ ctx: platform?.ctx, cookies }).fetch(request);

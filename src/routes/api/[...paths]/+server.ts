import { createApi } from "$lib/server/api";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ request, platform }) =>
  createApi(platform?.ctx).fetch(request);
export const POST: RequestHandler = ({ request, platform }) =>
  createApi(platform?.ctx).fetch(request);

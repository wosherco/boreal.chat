import { createApi } from "$lib/server/api";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ request, platform, cookies, setHeaders }) =>
  createApi({ ctx: platform?.ctx, cookies, setHeaders }).fetch(request);
export const POST: RequestHandler = ({ request, platform, cookies, setHeaders }) =>
  createApi({ ctx: platform?.ctx, cookies, setHeaders }).fetch(request);

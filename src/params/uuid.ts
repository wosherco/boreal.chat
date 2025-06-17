import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(param);
}) satisfies ParamMatcher;

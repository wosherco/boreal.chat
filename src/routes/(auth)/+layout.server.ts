import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent }) => {
  const parentData = await parent();

  return {
    ...parentData,
  };
};

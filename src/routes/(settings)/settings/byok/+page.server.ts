import { db } from "$lib/server/db";
import { openRouterKeyTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (!locals.user) {
    return {
      byok: {
        openrouter: null,
      },
    };
  }

  const openrouterAccount = db
    .select({
      createdAt: openRouterKeyTable.createdAt,
      updatedAt: openRouterKeyTable.updatedAt,
    })
    .from(openRouterKeyTable)
    .where(eq(openRouterKeyTable.userId, locals.user.id))
    .limit(1)
    .execute()
    .then(([openrouterAccount]) => openrouterAccount ?? null);

  return {
    byok: {
      openrouter: openrouterAccount,
    },
  };
};

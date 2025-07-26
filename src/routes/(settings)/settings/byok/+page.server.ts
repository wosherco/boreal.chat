import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { byokTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { BYOKInfo } from "$lib/common/sharedTypes";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      byok: {
        openrouter: null,
      },
    };
  }

  const byoks = db
    .select({
      id: byokTable.id,
      platform: byokTable.platform,
      createdAt: byokTable.createdAt,
      updatedAt: byokTable.updatedAt,
    })
    .from(byokTable)
    .where(eq(byokTable.userId, locals.user.id))
    .execute() satisfies Promise<BYOKInfo[]>;

  return {
    byok: {
      byoks,
    },
  };
};

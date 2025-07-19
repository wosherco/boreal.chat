import type { PageServerLoad } from "./$types";
import { type Chat, type ServerData } from "$lib/common/sharedTypes";
import { db } from "$lib/server/db";
import { chatTable } from "$lib/server/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { transformKeyToCamelCaseRecursive } from "$lib/client/hooks/utils";
import { building } from "$app/environment";

export const load: PageServerLoad = async ({ locals }) => {
  if (building) {
    return {};
  }

  const userId = locals.user?.id;

  const archivedChats = userId
    ? (db
        .select({
          id: chatTable.id,
          title: chatTable.title,
          pinned: chatTable.pinned,
          archived: chatTable.archived,
          deletedAt: chatTable.deletedAt,
          createdAt: chatTable.createdAt,
          updatedAt: chatTable.updatedAt,
        })
        .from(chatTable)
        .where(
          and(
            eq(chatTable.userId, userId),
            eq(chatTable.archived, true),
            isNull(chatTable.deletedAt),
          ),
        )
        .orderBy(desc(chatTable.updatedAt))
        .execute()
        .then((rows) =>
          rows.map(
            (row) =>
              transformKeyToCamelCaseRecursive(
                row as unknown as Record<string, unknown>,
              ) as unknown as Chat,
          ),
        ) satisfies ServerData<Chat[]>)
    : [];

  return {
    archivedChats,
  };
};

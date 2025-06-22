import type { LayoutServerLoad } from "./$types";
import { SIDEBAR_COLLAPSED_COOKIE } from "$lib/common/cookies";
import { type Chat, type ServerData } from "$lib/common/sharedTypes";
import { db } from "$lib/server/db";
import { chatTable } from "$lib/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { transformKeyToCamelCaseRecursive } from "$lib/client/hooks/utils";
import { building } from "$app/environment";

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  if (building) {
    return {};
  }

  const userId = locals.user?.id;

  const sidebarCollapsed = cookies.get(SIDEBAR_COLLAPSED_COOKIE) === "true";

  const lastChats = userId
    ? (db
        .select({
          id: chatTable.id,
          title: chatTable.title,
          createdAt: chatTable.createdAt,
          updatedAt: chatTable.updatedAt,
        })
        .from(chatTable)
        .where(eq(chatTable.userId, userId))
        .orderBy(desc(chatTable.updatedAt))
        .limit(40)
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
    sidebarCollapsed,
    lastChats,
  };
};

import type { LayoutServerLoad } from "./$types";
import { SIDEBAR_COLLAPSED_COOKIE } from "$lib/common/cookies";
import { type Chat, type Draft, type ServerData } from "$lib/common/sharedTypes";
import { db } from "$lib/server/db";
import { chatTable, draftsTable } from "$lib/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { transformKeyToCamelCaseRecursive } from "$lib/client/hooks/utils";
import { building } from "$app/environment";
import { getDraftIdFromUrl } from "$lib/utils/drafts";

export const load: LayoutServerLoad = async ({ cookies, locals, url }) => {
  if (building) {
    return {};
  }

  const userId = locals.user?.id;

  const sidebarCollapsed = cookies.get(SIDEBAR_COLLAPSED_COOKIE) === "true";

  const draftId = getDraftIdFromUrl(url);
  const [draft] =
    userId && draftId
      ? await db
          .select({
            id: draftsTable.id,
            content: draftsTable.content,
            selectedModel: draftsTable.selectedModel,
            reasoningLevel: draftsTable.reasoningLevel,
            webSearchEnabled: draftsTable.webSearchEnabled,
            createdAt: draftsTable.createdAt,
            updatedAt: draftsTable.updatedAt,
          })
          .from(draftsTable)
          .where(and(eq(draftsTable.id, draftId), eq(draftsTable.userId, userId)))
          .execute()
      : [];

  const lastChats = userId
    ? (db
        .select({
          id: chatTable.id,
          title: chatTable.title,
          pinned: chatTable.pinned,
          createdAt: chatTable.createdAt,
          updatedAt: chatTable.updatedAt,
        })
        .from(chatTable)
        .where(eq(chatTable.userId, userId))
        .orderBy(desc(chatTable.pinned), desc(chatTable.updatedAt))
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
    draft: draft satisfies ServerData<Draft>,
  };
};

import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { chatShareTable, messageTable } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { fetchThreadMessagesRecursive } from "$lib/server/services/messages";
import { error } from "@sveltejs/kit";

function checkPrivacy(
  share: { privacy: string; allowedEmails: unknown },
  userEmail: string | null,
) {
  if (share.privacy === "private") return false;
  if (share.privacy === "emails") {
    const list = (share.allowedEmails as string[]) || [];
    return userEmail !== null && list.includes(userEmail);
  }
  return true;
}

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
  const { shareId } = params;

  const [chatShare] = await db
    .select()
    .from(chatShareTable)
    .where(eq(chatShareTable.chatId, shareId));

  if (!chatShare) {
    throw error(404, "Not found");
  }

  if (!checkPrivacy(chatShare, locals.user?.email ?? null)) {
    throw error(401, "Unauthorized");
  }
  if (chatShare.privacy === "public") {
    setHeaders({ "X-Robots-Tag": "noindex" });
  }

  const [lastMessage] = await db
    .select({ messageId: messageTable.id, threadId: messageTable.threadId })
    .from(messageTable)
    .where(eq(messageTable.chatId, chatShare.chatId))
    .orderBy(desc(messageTable.createdAt))
    .limit(1);

  if (!lastMessage) {
    return { type: "chat", messages: [], chatId: chatShare.chatId };
  }

  const messages = await fetchThreadMessagesRecursive(db, lastMessage.threadId, {
    lastMessageId: lastMessage.messageId,
    maxDepth: 15,
  });
  return { type: "chat", messages, chatId: chatShare.chatId };
};

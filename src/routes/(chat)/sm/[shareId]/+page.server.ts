import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { messageShareTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
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

  const [msgShare] = await db
    .select()
    .from(messageShareTable)
    .where(eq(messageShareTable.id, shareId));

  if (!msgShare) {
    throw error(404, "Not found");
  }

  if (!checkPrivacy(msgShare, locals.user?.email ?? null)) {
    throw error(401, "Unauthorized");
  }
  if (msgShare.privacy === "public") {
    setHeaders({ "X-Robots-Tag": "noindex" });
  }
  const messages = await fetchThreadMessagesRecursive(db, msgShare.threadId, {
    lastMessageId: msgShare.messageId,
    maxDepth: 15,
  });
  return { type: "message", messages, chatId: msgShare.chatId };
};

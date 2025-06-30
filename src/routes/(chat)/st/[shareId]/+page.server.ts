import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { threadShareTable } from "$lib/server/db/schema";
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

  const [threadShare] = await db
    .select()
    .from(threadShareTable)
    .where(eq(threadShareTable.id, shareId));

  if (!threadShare) {
    throw error(404, "Not found");
  }

  if (!checkPrivacy(threadShare, locals.user?.email ?? null)) {
    throw error(401, "Unauthorized");
  }
  if (threadShare.privacy === "public") {
    setHeaders({ "X-Robots-Tag": "noindex" });
  }
  const messages = await fetchThreadMessagesRecursive(db, threadShare.threadId, {
    lastMessageId: threadShare.lastMessageId,
    maxDepth: 15,
  });
  return { type: "thread", messages, chatId: threadShare.chatId };
};

import type { PageServerLoad } from "./$types";
import { fetchThreadMessagesRecursive } from "$lib/server/services/messages";
import { error, redirect } from "@sveltejs/kit";
import { ORPCError } from "@orpc/client";
import { getThreadShare } from "$lib/server/services/shares";
import { threadTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
  const { shareId } = params;

  let threadId: string;
  let lastMessageId: string;
  try {
    const threadShare = await getThreadShare(shareId, locals.user?.email ?? undefined);
    threadId = threadShare.threadId;
    lastMessageId = threadShare.lastMessageId;
  } catch (e) {
    if (e instanceof ORPCError) {
      throw error(e.status, e.message);
    }

    throw e;
  }

  // Get the thread to find the owner
  const [thread] = await db
    .select({ chatId: threadTable.chatId, userId: threadTable.userId })
    .from(threadTable)
    .where(eq(threadTable.id, threadId))
    .limit(1);

  if (!thread) {
    throw error(404, "Thread not found");
  }

  // If user is logged in and is the owner of the thread, redirect to the original chat
  if (locals.user && thread.userId === locals.user.id) {
    throw redirect(302, `/chat/${thread.chatId}`);
  }

  setHeaders({ "X-Robots-Tag": "noindex" });

  const threadMessages = await fetchThreadMessagesRecursive(db, threadId, {
    lastMessageId,
  });

  return {
    share: {
      threadId,
      messages: threadMessages,
      isSharedView: true,
    },
  };
};

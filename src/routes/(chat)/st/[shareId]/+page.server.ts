import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { fetchThreadMessagesRecursive } from "$lib/server/services/messages";
import { error } from "@sveltejs/kit";
import { ORPCError } from "@orpc/client";
import { getThreadShare } from "$lib/server/services/shares";

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

  setHeaders({ "X-Robots-Tag": "noindex" });
  const messages = await fetchThreadMessagesRecursive(db, threadId, {
    lastMessageId,
  });

  return {
    share: {
      threadId,
      messages,
    },
  };
};

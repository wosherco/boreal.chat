import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { fetchMessages } from "$lib/server/services/messages";
import { error } from "@sveltejs/kit";
import { getMessageShare } from "$lib/server/services/shares";
import { ORPCError } from "@orpc/client";

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
  const { shareId } = params;

  let messageId: string;
  try {
    const msgShare = await getMessageShare(shareId, locals.user?.email ?? undefined);
    messageId = msgShare.messageId;
  } catch (e) {
    if (e instanceof ORPCError) {
      throw error(e.status, e.message);
    }

    throw e;
  }

  setHeaders({ "X-Robots-Tag": "noindex" });

  const [message] = await fetchMessages(db, [messageId]);
  return {
    share: {
      message,
    },
  };
};

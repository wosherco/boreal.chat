import type { PageServerLoad } from "./$types";
import { fetchMessages } from "$lib/server/services/messages";
import { error, redirect } from "@sveltejs/kit";
import { ORPCError } from "@orpc/client";
import { getMessageShare } from "$lib/server/services/shares";
import { chatTable, messageTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";

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

  // Get the message to find the chat
  const [message] = await db
    .select({ chatId: messageTable.chatId, userId: messageTable.userId })
    .from(messageTable)
    .where(eq(messageTable.id, messageId))
    .limit(1);

  if (!message) {
    throw error(404, "Message not found");
  }

  // If user is logged in and is the owner of the message, redirect to the original chat
  if (locals.user && message.userId === locals.user.id) {
    throw redirect(302, `/chat/${message.chatId}`);
  }

  setHeaders({ "X-Robots-Tag": "noindex" });

  const [fetchedMessage] = await fetchMessages(db, [messageId]);

  return {
    share: {
      message: fetchedMessage,
      isSharedView: true,
    },
  };
};

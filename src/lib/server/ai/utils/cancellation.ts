import { sql } from "$lib/server/db";

const PREFIX = "cancel_";

export async function listenForCancellation(messageId: string, onCancel: () => void) {
  const channel = PREFIX + messageId;
  const { unlisten } = await sql.listen(channel, () => {
    onCancel();
  });

  return async () => {
    await unlisten();
  };
}

export function notifyCancellation(messageId: string) {
  return sql.notify(PREFIX + messageId);
}

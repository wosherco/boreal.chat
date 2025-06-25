import { postgresClient } from "..";

function createKey(messageId: string) {
  return `v1:message_cancellation:${messageId}`;
}

export async function sendCancelMessage(messageId: string) {
  await postgresClient.notify(createKey(messageId), "cancel");
}

export async function listenForCancelMessage(messageId: string, callback: () => void) {
  const listener = await postgresClient.listen(createKey(messageId), () => callback());

  return listener;
}

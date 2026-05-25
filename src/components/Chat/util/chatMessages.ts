import type { AnyChatMessageType } from './messageHandlers';

export function isRenderableChatMessage(
  message: AnyChatMessageType | undefined,
): message is AnyChatMessageType {
  return Boolean(message?.message_id && message.message_nonce);
}

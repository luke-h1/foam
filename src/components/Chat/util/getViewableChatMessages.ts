import type { AnyChatMessageType } from '@app/store/chat/types/constants';

export type ViewableMessageToken = {
  item?: AnyChatMessageType;
  isViewable?: boolean | null;
};

export function getViewableChatMessages(
  viewableItems: ViewableMessageToken[],
): AnyChatMessageType[] {
  const messages: AnyChatMessageType[] = [];

  for (const token of viewableItems) {
    if (token.isViewable && token.item) {
      messages.push(token.item);
    }
  }

  return messages;
}

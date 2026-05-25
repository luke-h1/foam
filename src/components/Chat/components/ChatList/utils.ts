import type { AnyChatMessageType } from '../../util/messageHandlers';

export type ViewableMessageToken = {
  item?: AnyChatMessageType;
  isViewable?: boolean | null;
};

export function getViewableChatMessages(
  viewableItems: ViewableMessageToken[],
): AnyChatMessageType[] {
  return viewableItems
    .filter(item => item.isViewable && item.item)
    .map(item => item.item as AnyChatMessageType);
}

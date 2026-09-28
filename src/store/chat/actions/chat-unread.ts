import { chatUnreadCount$ } from '../observables/chat-unread-count';

export function incrementChatUnread(count: number): void {
  chatUnreadCount$.set(chatUnreadCount$.peek() + count);
}

export function resetChatUnread(): void {
  chatUnreadCount$.set(0);
}

export function getChatUnreadCount(): number {
  return chatUnreadCount$.peek();
}

import { chatUnreadCount$ } from '../observables/chatUnreadCount';

export function incrementChatUnread(count: number): void {
  chatUnreadCount$.set(chatUnreadCount$.peek() + count);
}

export function resetChatUnread(): void {
  chatUnreadCount$.set(0);
}

export function getChatUnreadCount(): number {
  return chatUnreadCount$.peek();
}

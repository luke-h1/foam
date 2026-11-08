export interface PinnedChatMessageViewModel {
  expiresAt?: string | null;
  messageId: string;
  pinnedByName?: string;
  senderName?: string;
  text: string;
  updatedAt?: string;
}

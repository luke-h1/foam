export interface WhisperMessage {
  id: string;
  body: string;
  /**
   * Login of whoever sent the whisper
   */
  senderLogin: string;
  senderDisplayName: string;
  senderColor?: string;

  /**
   * True when the current user sent it
   */
  isOutgoing: boolean;
  receivedAt: number;
}

export interface WhisperThread {
  /**
   * Twitch user id of the other participant.
   */
  partnerUserId: string;
  partnerLogin: string;
  partnerDisplayName: string;
  /**
   * Helix profile image URL when known.
   */
  partnerProfileImageUrl?: string;
  messages: WhisperMessage[];
  unreadCount: number;
  lastMessageAt: number;
}

/**
 * Twitch offers no history endpoint for third-party-client,
 * so lets just set a max whisper message per thread
 */
export const MAX_WHISPER_MESSAGES_PER_THREAD = 500;

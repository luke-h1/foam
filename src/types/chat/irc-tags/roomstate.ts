export interface RoomStateTags {
  /**
   * Boolean value which determines whether the chat room allows only
   * messages with emotes
   */
  emote_only: '1' | '0';

  /**
   * Integer which determines whether only followers can post messages in chat
   * -1 = not restricted
   */
  'followers-only': number;

  /**
   * Bool determining if user's messages must be unique
   * Applies to messages above 9 characters
   */
  r9k: '1' | '0';

  'room-id': string;

  /**
   * Integer value determining how long (in seconds)
   * users must wait before sending messages
   */
  slow: number;

  'subs-only': boolean;
}

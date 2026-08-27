export interface RoomStateTags {
  emote_only: '1' | '0';

  /**
   * -1 = not restricted.
   */
  'followers-only': number;

  /**
   * Unique-messages mode; applies to messages over 9 characters.
   */
  r9k: '1' | '0';

  'room-id': string;

  /**
   * Seconds users must wait between messages.
   */
  slow: number;

  'subs-only': boolean;
}

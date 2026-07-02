export interface ClearChatTags {
  /**
   * Indicates if the user was put in a timeout
   * instead of a ban. This contains the duration of the timeout
   * in seconds
   */
  'ban-duration'?: string;

  /**
   * the ID of the channel where the messages were removed from
   */
  'room-id': string;

  /**
   * Optional ID of the user that was banned or put in timeout
   */
  'target-user-id'?: string;

  /**
   * UNIX timestamp
   */
  'tmi-send-ts': string;
}

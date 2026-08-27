export interface ClearChatTags {
  /**
   * Present for timeouts, absent for bans; timeout duration in seconds.
   */
  'ban-duration'?: string;

  'room-id': string;

  'target-user-id'?: string;

  /**
   * UNIX timestamp
   */
  'tmi-send-ts': string;
}

export interface ClearMsgTags {
  /**
   * The name of the user who sent the message
   */
  login: string;

  /**
   * The ID of the channel where the message was removed from
   */
  'room-id'?: string;

  /**
   * The ID of the message in UUID format
   */
  'target-msg-id': string;

  /**
   * UNIX timestamp
   */
  'tmi-sent-ts': string;
}

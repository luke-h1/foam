export interface ClearMsgTags {
  login: string;

  'room-id'?: string;

  'target-msg-id': string;

  /**
   * UNIX timestamp
   */
  'tmi-sent-ts': string;
}

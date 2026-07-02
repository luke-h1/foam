/**
 * Chat modes parsed from an IRC ROOMSTATE message.
 */
export interface ParsedRoomState {
  emoteOnly: boolean;
  followersOnlyMinutes: number;
  r9k: boolean;
  slowSeconds: number;
  subsOnly: boolean;
}

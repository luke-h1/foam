import type { ParsedRoomState } from '@app/store/chat/types/roomState';

export const emptyRoomState: ParsedRoomState = {
  emoteOnly: false,
  followersOnlyMinutes: -1,
  r9k: false,
  slowSeconds: 0,
  subsOnly: false,
};

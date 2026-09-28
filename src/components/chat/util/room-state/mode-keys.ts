import {
  ROOM_STATE_MODES,
  type RoomStateModeKey,
} from '@app/components/chat/util/room-state/room-state-modes';

export const MODE_KEYS =
  // SAFETY: RoomStateModeKey is the key union of ROOM_STATE_MODES.
  Object.keys(ROOM_STATE_MODES) as RoomStateModeKey[];

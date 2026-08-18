import {
  ROOM_STATE_MODES,
  type RoomStateModeKey,
} from '@app/components/Chat/util/roomState/ROOM_STATE_MODES';

export const MODE_KEYS =
  // SAFETY: RoomStateModeKey is the key union of ROOM_STATE_MODES.
  Object.keys(ROOM_STATE_MODES) as RoomStateModeKey[];

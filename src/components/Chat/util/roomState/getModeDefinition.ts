import {
  ROOM_STATE_MODES,
  type RoomStateModeKey,
} from '@app/components/Chat/util/roomState/ROOM_STATE_MODES';
import type { RoomStateModeDefinition } from '@app/components/Chat/util/roomState/types';

export function getModeDefinition(
  key: RoomStateModeKey,
): RoomStateModeDefinition {
  return ROOM_STATE_MODES[key];
}

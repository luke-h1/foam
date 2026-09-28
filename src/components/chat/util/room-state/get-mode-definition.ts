import {
  ROOM_STATE_MODES,
  type RoomStateModeKey,
} from '@app/components/chat/util/room-state/room-state-modes';
import type { RoomStateModeDefinition } from '@app/components/chat/util/room-state/types';

export function getModeDefinition(
  key: RoomStateModeKey,
): RoomStateModeDefinition {
  return ROOM_STATE_MODES[key];
}

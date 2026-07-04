import type { ParsedRoomState } from '@app/store/chat/types/roomState';

import {
  describeInitialRoomState,
  describeRoomStateChanges,
  parseRoomStateTags,
} from './roomState';

export interface RoomStateUpdate {
  state: ParsedRoomState | null;
  notices: string[];
}

export interface RoomStateTracker {
  /**
   * Applies a ROOMSTATE tag set. The first ingest after creation or a reset
   * summarises every active mode; later ingests describe only what changed.
   */
  ingest: (tags: Record<string, string>) => RoomStateUpdate;
  /**
   * Clears the diff baseline so the next ingest is announced as an initial
   * room state again; call on part, reconnect, or channel switch.
   */
  reset: () => RoomStateUpdate;
}

export function createRoomStateTracker(): RoomStateTracker {
  let current: ParsedRoomState | null = null;

  return {
    ingest(tags) {
      const next = parseRoomStateTags(tags);
      const previous = current;
      current = next;

      if (!previous) {
        const initialDescription = describeInitialRoomState(next);
        return {
          state: next,
          notices: initialDescription ? [initialDescription] : [],
        };
      }

      return {
        state: next,
        notices: describeRoomStateChanges(previous, next),
      };
    },
    reset() {
      current = null;
      return { state: null, notices: [] };
    },
  };
}

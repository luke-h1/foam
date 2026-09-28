import { getModeDefinition } from '@app/components/chat/util/room-state/get-mode-definition';
import { MODE_KEYS } from '@app/components/chat/util/room-state/mode-keys';
import type { ParsedRoomState } from '@app/store/chat/types/room-state';

export function describeInitialRoomState(
  state: ParsedRoomState,
): string | null {
  const activeModes = MODE_KEYS.flatMap(key => {
    const mode = getModeDefinition(key);
    const status = mode.getStatus(state);
    return status.active ? [mode.activeSummary(status.value)] : [];
  });

  if (activeModes.length === 0) {
    return null;
  }

  return `Chat modes active: ${activeModes.join(', ')}`;
}

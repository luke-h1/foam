import { getModeDefinition } from '@app/components/Chat/util/roomState/getModeDefinition';
import { MODE_KEYS } from '@app/components/Chat/util/roomState/MODE_KEYS';
import type { ParsedRoomState } from '@app/store/chat/types/roomState';

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

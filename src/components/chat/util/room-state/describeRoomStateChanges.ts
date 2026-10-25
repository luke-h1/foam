import { getModeDefinition } from '@app/components/chat/util/room-state/getModeDefinition';
import { MODE_KEYS } from '@app/components/chat/util/room-state/modeKeys';
import type { ParsedRoomState } from '@app/store/chat/types/room-state';

export function describeRoomStateChanges(
  previous: ParsedRoomState,
  next: ParsedRoomState,
): string[] {
  return MODE_KEYS.flatMap(key => {
    const mode = getModeDefinition(key);
    const previousStatus = mode.getStatus(previous);
    const nextStatus = mode.getStatus(next);

    if (
      previousStatus.active === nextStatus.active &&
      previousStatus.value === nextStatus.value
    ) {
      return [];
    }

    return [
      nextStatus.active
        ? mode.enabledNotice(nextStatus.value)
        : mode.disabledNotice,
    ];
  });
}

import type { SanitisedEmote } from '@app/types/emote';
import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';

export interface SevenTvEmoteDelta {
  from: SanitisedEmote[];
  to: SanitisedEmote[];
  names: Set<string>;
}

const MAX_PENDING_DELTAS = 8;

const pendingDeltas = new Map<string, SevenTvEmoteDelta>();

export function recordSevenTvEmoteDelta(
  channelId: string,
  from: SanitisedEmote[],
  to: SanitisedEmote[],
  changed: readonly SanitisedEmote[],
): void {
  const pending = pendingDeltas.get(channelId);
  const extendsPending = pending !== undefined && pending.to === from;
  const names = extendsPending ? pending.names : new Set<string>();

  for (const emote of changed) {
    names.add(emote.name);
  }

  setBoundedMapEntry(
    pendingDeltas,
    channelId,
    { from: extendsPending ? pending.from : from, to, names },
    MAX_PENDING_DELTAS,
  );
}

export function takeSevenTvEmoteDelta(
  channelId: string,
): SevenTvEmoteDelta | undefined {
  const delta = pendingDeltas.get(channelId);
  pendingDeltas.delete(channelId);
  return delta;
}

export function clearSevenTvEmoteDeltas(): void {
  pendingDeltas.clear();
}

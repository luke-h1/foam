import type { EnrichScope } from '@app/store/chat/actions/message-enrichment';
import type { SevenTvEmoteDelta } from '@app/store/chat/actions/seven-tv-emote-delta';
import {
  ALL_SLICE_KEYS,
  type ChatResourceSliceKey,
  type ChatResourceSliceRecord,
} from '@app/store/chat/types/chat-resource-slices';

/**
 * A typical 7TV edit adds, removes or renames one or two emotes. Past this many
 * names the update is a bulk edit that touches most rows anyway, so the
 * name filter saves little and the pass re-resolves every row.
 */
export const MAX_FILTERED_EMOTE_NAMES = 32;

export type ChannelEmoteDataSnapshot = Partial<
  ChatResourceSliceRecord<ChatResourceSliceKey>
>;

export interface EmoteReprocessInputs {
  channelId: string;
  channelEmoteData: ChannelEmoteDataSnapshot | null;
  emoteLoadStatus: string;
  show7TvEmotes: boolean;
  userLogin?: string | null;
}

interface PickEmoteReprocessScopeOptions {
  delta: SevenTvEmoteDelta | undefined;
  previous: EmoteReprocessInputs | null;
  next: EmoteReprocessInputs;
  interruptedPass: EnrichScope['kind'] | null;
  processedSetCleared: boolean;
}

function onlySevenTvChannelEmotesChanged(
  previous: ChannelEmoteDataSnapshot,
  next: ChannelEmoteDataSnapshot,
): boolean {
  return ALL_SLICE_KEYS.every(
    key => key === 'sevenTvChannelEmotes' || previous[key] === next[key],
  );
}

function isOnlyThisDelta(
  delta: SevenTvEmoteDelta,
  previous: EmoteReprocessInputs,
  next: EmoteReprocessInputs,
): boolean {
  const before = previous.channelEmoteData;
  const after = next.channelEmoteData;

  return (
    before !== null &&
    after !== null &&
    previous.channelId === next.channelId &&
    previous.emoteLoadStatus === next.emoteLoadStatus &&
    previous.show7TvEmotes === next.show7TvEmotes &&
    previous.userLogin === next.userLogin &&
    before.sevenTvChannelEmotes === delta.from &&
    after.sevenTvChannelEmotes === delta.to &&
    onlySevenTvChannelEmotesChanged(before, after)
  );
}

/**
 * Narrows a reprocess run to the rows a live 7TV emote_set.update can change.
 * Any other change since the last run keeps the default pass. A narrowed pass
 * that this run interrupts has skipped processed rows, so the run re-resolves
 * every row.
 */
export function pickEmoteReprocessScope({
  delta,
  previous,
  next,
  interruptedPass,
  processedSetCleared,
}: PickEmoteReprocessScopeOptions): EnrichScope {
  if (processedSetCleared) {
    return { kind: 'unprocessed' };
  }

  if (interruptedPass !== null && interruptedPass !== 'unprocessed') {
    return { kind: 'everyMessage' };
  }

  if (
    !delta ||
    !previous ||
    interruptedPass !== null ||
    !isOnlyThisDelta(delta, previous, next)
  ) {
    return { kind: 'unprocessed' };
  }

  if (delta.names.size > MAX_FILTERED_EMOTE_NAMES) {
    return { kind: 'everyMessage' };
  }

  return { kind: 'emoteNames', names: delta.names };
}

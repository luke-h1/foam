import type { SanitisedEmote } from '@app/types/emote';
import { getChatRowEmoteUrl } from '@app/utils/emote/chatRowEmoteUrl';

const EMOTE_WARM_LIMIT = 64;

export interface EmoteWarmLists {
  sevenTv?: readonly SanitisedEmote[];
  bttv?: readonly SanitisedEmote[];
  ffz?: readonly SanitisedEmote[];
  twitch?: readonly SanitisedEmote[];
}

export function orderEmotesForWarm({
  sevenTv = [],
  bttv = [],
  ffz = [],
  twitch = [],
}: EmoteWarmLists): SanitisedEmote[] {
  return [...sevenTv, ...bttv, ...ffz, ...twitch];
}

interface CollectEmoteWarmUrlsOptions {
  disableAnimations: boolean;
  limit?: number;
  accept?: (url: string) => boolean;
}

export function collectEmoteWarmUrls(
  emotes: readonly SanitisedEmote[],
  {
    disableAnimations,
    limit = EMOTE_WARM_LIMIT,
    accept,
  }: CollectEmoteWarmUrlsOptions,
): string[] {
  const urls = new Set<string>();

  for (const emote of emotes) {
    if (urls.size >= limit) {
      break;
    }

    const url = getChatRowEmoteUrl(emote, { disableAnimations });

    if (url && (!accept || accept(url))) {
      urls.add(url);
    }
  }

  return [...urls];
}

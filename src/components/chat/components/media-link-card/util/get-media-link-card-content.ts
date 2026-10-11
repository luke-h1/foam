import type { SevenTvEmotePreview } from '@app/types/seven-tv/emotes';
import type { TwitchClip } from '@app/types/twitch/clip';
import type { MediaLinkTokenKind } from '@app/utils/chat/message-token';

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  notation: 'compact',
});

interface GetMediaLinkCardContentOptions {
  fallbackThumbnail: string | undefined;
  sevenTvEmote: SevenTvEmotePreview | null | undefined;
  twitchClip: TwitchClip | null | undefined;
  type: MediaLinkTokenKind;
}

function getStvEmoteThumbnail(
  sevenTvEmote: SevenTvEmotePreview | null | undefined,
  fallbackThumbnail: string | undefined,
) {
  if (sevenTvEmote?.id) {
    return `https://cdn.7tv.app/emote/${sevenTvEmote.id}/4x`;
  }

  return fallbackThumbnail;
}

function getTwitchClipMeta(
  createdBy: string | null | undefined,
  viewCount: number | undefined,
) {
  const parts = [
    createdBy ? `Clipped by ${createdBy}` : null,
    Number(viewCount) === viewCount && viewCount > 0
      ? `${formatCompactNumber(viewCount)} views`
      : null,
  ]
    .filter(Boolean)
    .join(' - ');

  return parts || 'Open Twitch clip';
}

function getSevenTvEmoteMeta(createdBy: string | null | undefined) {
  if (createdBy) {
    return `By ${createdBy}`;
  }

  return '7TV emote';
}

/**
 * Everything the card shows, picked from whichever of the two payloads the
 * link type points at, with the fallbacks a pending or failed fetch needs.
 */
export function getMediaLinkCardContent({
  fallbackThumbnail,
  sevenTvEmote,
  twitchClip,
  type,
}: GetMediaLinkCardContentOptions) {
  const isTwitchClip = type === 'twitchClip';

  let thumbnail: string | undefined;

  if (type === 'stvEmoteLink') {
    thumbnail = getStvEmoteThumbnail(sevenTvEmote, fallbackThumbnail);
  } else {
    thumbnail = twitchClip?.thumbnail_url ?? fallbackThumbnail;
  }

  const title =
    type === 'stvEmoteLink'
      ? (sevenTvEmote?.name ?? '7TV emote')
      : (twitchClip?.title ?? 'Twitch clip');

  const createdBy =
    type === 'stvEmoteLink'
      ? sevenTvEmote?.owner?.display_name || sevenTvEmote?.owner?.username
      : twitchClip?.creator_name;

  const viewCount = twitchClip?.view_count;

  const mediaMeta = isTwitchClip
    ? getTwitchClipMeta(createdBy, viewCount)
    : getSevenTvEmoteMeta(createdBy);

  return {
    createdBy,
    mediaImageFit: isTwitchClip ? ('cover' as const) : ('contain' as const),
    mediaLabel: isTwitchClip ? 'Twitch clip' : '7TV emote',
    mediaMeta,
    thumbnail,
    title,
  };
}

function formatCompactNumber(value: number): string {
  return COMPACT_NUMBER_FORMATTER.format(value);
}

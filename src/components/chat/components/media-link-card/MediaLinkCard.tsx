import { memo } from 'react';

import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';

import { emoteKeys, twitchKeys } from '@app/lib/react-query/queryKeys';
import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchService } from '@app/services/twitch-service';
import { type MediaLinkTokenKind } from '@app/types/chat/messageToken';
import { getTwitchClipIdFromUrl } from '@app/utils/chat/parse-word-link-tokens/getTwitchClipIdFromUrl';
import { SEVEN_TV_EMOTE_LINK_REGEX } from '@app/utils/chat/parse-word-link-tokens/sevenTvEmoteLinkRegex';

import { InlineEmoteChip } from './InlineEmoteChip';
import { MediaLinkCardView } from './MediaLinkCardView';
import { getMediaLinkCardContent } from './util/getMediaLinkCardContent';

type MediaLinkCardProps = {
  layout?: 'card' | 'inline';
  thumbnail?: string;
  type: MediaLinkTokenKind;
  url: string;
};

function MediaLinkCardComponent({
  layout = 'card',
  thumbnail: fallbackThumbnail,
  type,
  url,
}: MediaLinkCardProps) {
  const twitchClipId =
    type === 'twitchClip' ? getTwitchClipIdFromUrl(url) : undefined;

  const sevenTvEmoteId =
    type === 'stvEmoteLink'
      ? SEVEN_TV_EMOTE_LINK_REGEX.exec(url)?.[1]
      : undefined;

  const [sevenTvEmote, twitchClip] = useQueries({
    queries: [
      {
        queryKey: emoteKeys.sevenTvEmote(sevenTvEmoteId ?? ''),
        queryFn: () => {
          if (!sevenTvEmoteId) {
            throw new Error('Missing 7TV emote ID');
          }

          return sevenTvService.getEmote(sevenTvEmoteId);
        },
        enabled: Boolean(sevenTvEmoteId),
        // Emote and clip metadata is effectively immutable, so recycled chat
        // rows must not refetch it on every remount past the default 30s.
        staleTime: Infinity,
      },
      {
        queryKey: twitchKeys.clip(twitchClipId ?? ''),
        queryFn: () => {
          if (!twitchClipId) {
            throw new Error('Missing Twitch clip ID');
          }

          return twitchService.getClip(twitchClipId);
        },
        enabled: Boolean(twitchClipId),
        staleTime: Infinity,
      },
    ],
  });

  const openClip = twitchClipId
    ? () => router.push(`/streams/clip/${encodeURIComponent(twitchClipId)}`)
    : undefined;

  const isPending =
    (Boolean(sevenTvEmoteId) && sevenTvEmote.isPending) ||
    (Boolean(twitchClipId) && twitchClip.isPending);

  const isTwitchClip = type === 'twitchClip';

  const { mediaImageFit, mediaLabel, mediaMeta, thumbnail, title } =
    getMediaLinkCardContent({
      fallbackThumbnail,
      sevenTvEmote: sevenTvEmote.data,
      twitchClip: twitchClip.data,
      type,
    });

  const isInlineEmote = layout === 'inline' && type === 'stvEmoteLink';

  if (isInlineEmote) {
    return (
      <InlineEmoteChip
        isPending={isPending}
        thumbnail={thumbnail}
        title={title}
      />
    );
  }

  return (
    <MediaLinkCardView
      isPending={isPending}
      isTwitchClip={isTwitchClip}
      mediaImageFit={mediaImageFit}
      mediaLabel={mediaLabel}
      mediaMeta={mediaMeta}
      onPress={openClip}
      thumbnail={thumbnail}
      title={title}
    />
  );
}

export const MediaLinkCard = memo(MediaLinkCardComponent);

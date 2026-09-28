import { memo, useCallback } from 'react';

import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';

import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchService } from '@app/services/twitch-service';
import { type MediaLinkTokenKind } from '@app/utils/chat/message-token';
import { getTwitchClipIdFromUrl } from '@app/utils/chat/parse-word-link-tokens/get-twitch-clip-id-from-url';
import { SEVEN_TV_EMOTE_LINK_REGEX } from '@app/utils/chat/parse-word-link-tokens/seven-tv-emote-link-regex';

import { InlineEmoteChip } from './inline-emote-chip';
import { MediaLinkCardView } from './media-link-card-view';
import { getMediaLinkCardContent } from './util/get-media-link-card-content';

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
  const twitchClipId = getTwitchClipIdFromUrl(url);

  const [sevenTvEmote, twitchClip] = useQueries({
    queries: [
      {
        queryKey: ['sevenTvEmote', url],
        queryFn: () => {
          const sevenTvMatch = url.match(SEVEN_TV_EMOTE_LINK_REGEX);
          const emoteId = sevenTvMatch?.[1] ?? '';
          return sevenTvService.getEmote(emoteId);
        },
        enabled: type === 'stvEmoteLink',
        // Emote and clip metadata is effectively immutable, so recycled chat
        // rows must not refetch it on every remount past the default 30s.
        staleTime: Infinity,
      },
      {
        queryKey: ['twitchClip', url],
        queryFn: () => {
          if (!twitchClipId) {
            throw new Error('Missing Twitch clip ID');
          }
          return twitchService.getClip(twitchClipId);
        },
        enabled: type === 'twitchClip' && Boolean(twitchClipId),
        staleTime: Infinity,
      },
    ],
  });

  const handlePress = useCallback(() => {
    if (type === 'twitchClip' && twitchClipId) {
      router.push(`/streams/clip/${encodeURIComponent(twitchClipId)}`);
    }
  }, [twitchClipId, type]);

  const isPending =
    (type === 'stvEmoteLink' && sevenTvEmote.isPending) ||
    (type === 'twitchClip' && twitchClip.isPending);

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
        onPress={handlePress}
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
      onPress={handlePress}
      thumbnail={thumbnail}
      title={title}
    />
  );
}

export const MediaLinkCard = memo(MediaLinkCardComponent);

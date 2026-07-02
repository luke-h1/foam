import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';

import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Text } from '@app/components/ui/Text/Text';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { type TwitchAnd7TVVariant } from '@app/utils/chat/parsedPart';
import {
  getTwitchClipIdFromUrl,
  SEVENTV_EMOTE_LINK_REGEX,
} from '@app/utils/chat/replaceTextWithEmotes';

type MediaLinkCardProps = {
  layout?: 'card' | 'inline';
  thumbnail?: string;
  type: TwitchAnd7TVVariant;
  url: string;
};

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  notation: 'compact',
});

function MediaLinkCardComponent({
  layout = 'card',
  thumbnail: fallbackThumbnail,
  type,
  url,
}: MediaLinkCardProps) {
  const { t } = useTranslation('chat');
  const twitchClipId = getTwitchClipIdFromUrl(url);
  const [sevenTvEmote, twitchClip] = useQueries({
    queries: [
      {
        queryKey: ['sevenTvEmote', url],
        queryFn: () => {
          const sevenTvMatch = url.match(SEVENTV_EMOTE_LINK_REGEX);
          const emoteId = sevenTvMatch?.[1] ?? '';
          return sevenTvService.getEmote(emoteId);
        },
        enabled: type === 'stvEmote',
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
      },
    ],
  });

  const handlePress = useCallback(() => {
    if (type === 'twitchClip' && twitchClipId) {
      router.push(`/streams/clip/${encodeURIComponent(twitchClipId)}`);
    }
  }, [twitchClipId, type]);

  const isPending =
    (type === 'stvEmote' && sevenTvEmote.isPending) ||
    (type === 'twitchClip' && twitchClip.isPending);

  const thumbnail =
    type === 'stvEmote'
      ? sevenTvEmote.data?.id
        ? `https://cdn.7tv.app/emote/${sevenTvEmote.data.id}/4x`
        : fallbackThumbnail
      : (twitchClip.data?.thumbnail_url ?? fallbackThumbnail);

  const title =
    type === 'stvEmote'
      ? (sevenTvEmote.data?.name ?? t('media.stvEmote'))
      : (twitchClip.data?.title ?? t('media.twitchClip'));

  const createdBy =
    type === 'stvEmote'
      ? sevenTvEmote.data?.owner?.display_name ||
        sevenTvEmote.data?.owner?.username
      : twitchClip.data?.creator_name;

  const viewCount = twitchClip.data?.view_count;
  const isTwitchClip = type === 'twitchClip';
  const mediaMeta = isTwitchClip
    ? [
        createdBy ? t('media.clippedBy', { name: createdBy }) : null,
        typeof viewCount === 'number' && viewCount > 0
          ? t('media.views', {
              count: formatCompactNumber(viewCount),
            })
          : null,
      ]
        .filter(Boolean)
        .join(' - ') || t('media.openTwitchClip')
    : createdBy
      ? t('media.by', { name: createdBy })
      : t('media.stvEmote');
  const mediaLabel = isTwitchClip ? t('media.twitchClip') : t('media.stvEmote');
  const mediaImageFit = isTwitchClip ? 'cover' : 'contain';

  if (layout === 'inline' && type === 'stvEmote') {
    if (isPending) {
      return (
        <View style={styles.inlineChip}>
          <Skeleton shimmer={false} style={styles.inlineThumbnail} />
          <Skeleton shimmer={false} style={styles.inlineTitleSkeleton} />
        </View>
      );
    }

    return (
      <Pressable
        accessibilityRole='button'
        onPress={handlePress}
        style={({ pressed }) => [
          styles.inlineChip,
          pressed && { opacity: 0.7 },
        ]}
      >
        {thumbnail ? (
          <Image
            trackLoadContext='chat.media-link-inline'
            source={thumbnail}
            style={styles.inlineThumbnail}
            contentFit='contain'
          />
        ) : null}
        <Text ellipsizeMode='tail' numberOfLines={1} style={styles.inlineTitle}>
          {title}
        </Text>
        <BrandIcon name='stv' size='xs' />
      </Pressable>
    );
  }

  if (isPending && !thumbnail) {
    return (
      <View style={[styles.mediaContainer, styles.mediaCard]}>
        <Skeleton shimmer={false} style={styles.mediaThumbnailFrame} />
        <View style={styles.mediaInfo}>
          <Skeleton shimmer={false} style={styles.mediaTitleSkeleton} />
          <Skeleton shimmer={false} style={styles.mediaMetaSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <Button
      accessibilityRole='button'
      label={title}
      style={styles.mediaContainer}
      onPress={handlePress}
    >
      <View style={styles.mediaCard}>
        <View style={styles.mediaThumbnailFrame}>
          {thumbnail ? (
            <Image
              trackLoadContext='chat.media-link-card'
              source={thumbnail}
              style={styles.mediaThumbnail}
              contentFit={mediaImageFit}
            />
          ) : (
            <View style={[styles.mediaThumbnail, styles.mediaThumbnailEmpty]}>
              {isTwitchClip ? (
                <SymbolView
                  name='play.tv.fill'
                  size={16}
                  tintColor={theme.colorPlum}
                />
              ) : (
                <BrandIcon name='stv' size='sm' />
              )}
            </View>
          )}
          {isTwitchClip ? (
            <View style={styles.playBadge}>
              <SymbolView
                name='play.fill'
                size={10}
                tintColor={theme.colorWhite}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.mediaInfo}>
          <View style={styles.mediaEyebrowRow}>
            {isTwitchClip ? (
              <SymbolView
                name='play.tv.fill'
                size={12}
                tintColor={theme.colorPlum}
              />
            ) : (
              <BrandIcon name='stv' size='xs' />
            )}
            <Text style={styles.mediaEyebrow}>{mediaLabel}</Text>
          </View>
          <Text
            ellipsizeMode='tail'
            numberOfLines={1}
            style={styles.mediaTitle}
          >
            {title}
          </Text>
          <Text ellipsizeMode='tail' numberOfLines={1} style={styles.mediaMeta}>
            {mediaMeta}
          </Text>
        </View>
      </View>
    </Button>
  );
}

export const MediaLinkCard = memo(MediaLinkCardComponent);

function formatCompactNumber(value: number): string {
  return COMPACT_NUMBER_FORMATTER.format(value);
}

const styles = StyleSheet.create({
  mediaCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 14, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  mediaContainer: {
    flexBasis: '100%',
    marginVertical: 4,
    maxWidth: 260,
  },
  mediaEyebrow: {
    color: theme.color.brand.twitchBorder,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 12,
  },
  mediaEyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  mediaInfo: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mediaMeta: {
    color: theme.color.textSecondary.dark,
    fontSize: 11,
    lineHeight: 13,
  },
  mediaMetaSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 10,
    width: '48%',
  },
  mediaThumbnail: {
    height: '100%',
    width: '100%',
  },
  mediaThumbnailEmpty: {
    alignItems: 'center',
    backgroundColor: 'rgba(145, 71, 255, 0.18)',
    justifyContent: 'center',
  },
  mediaThumbnailFrame: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    flexShrink: 0,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 88,
  },
  mediaTitle: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    lineHeight: 15,
  },
  mediaTitleSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 13,
    width: '82%',
  },
  playBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 22,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -11,
    marginTop: -11,
    position: 'absolute',
    top: '50%',
    width: 22,
  },
  inlineChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  inlineThumbnail: {
    borderCurve: 'continuous',
    borderRadius: 4,
    height: 28,
    width: 28,
  },
  inlineTitle: {
    color: theme.color.text.dark,
    flexShrink: 1,
    fontSize: theme.fontSize12,
    lineHeight: 15,
    maxWidth: 140,
  },
  inlineTitleSkeleton: {
    borderCurve: 'continuous',
    borderRadius: 4,
    height: 12,
    width: 72,
  },
});

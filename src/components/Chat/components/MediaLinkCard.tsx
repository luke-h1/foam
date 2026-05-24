import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Text } from '@app/components/ui/Text/Text';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import {
  SEVENTV_EMOTE_LINK_REGEX,
  TwitchAnd7TVVariant,
  getTwitchClipIdFromUrl,
} from '@app/utils/chat/replaceTextWithEmotes';
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

type MediaLinkCardProps = {
  type: TwitchAnd7TVVariant;
  url: string;
};

export function MediaLinkCard({ type, url }: MediaLinkCardProps) {
  const twitchClipId = useMemo(() => getTwitchClipIdFromUrl(url), [url]);
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

  const getBrandIcon = () => {
    switch (type) {
      case 'stvEmote':
        return <BrandIcon name="stv" size="md" />;
      case 'twitchClip':
        return <BrandIcon name="twitch" size="sm" />;
      default:
        return null;
    }
  };

  if (
    (type === 'stvEmote' && sevenTvEmote.isPending) ||
    (type === 'twitchClip' && twitchClip.isPending)
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Skeleton style={styles.thumbnail} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Skeleton style={styles.brandIconSkeleton} />
              <Skeleton style={styles.titleSkeleton} />
            </View>
            <Skeleton style={styles.createdBySkeleton} />
          </View>
        </View>
      </View>
    );
  }

  const thumbnail =
    type === 'stvEmote'
      ? `https://cdn.7tv.app/emote/${sevenTvEmote.data?.id}/4x`
      : twitchClip.data?.thumbnail_url;

  const title =
    type === 'stvEmote'
      ? (sevenTvEmote.data?.name ?? '7TV emote')
      : (twitchClip.data?.title ?? 'Twitch clip');

  const createdBy =
    type === 'stvEmote'
      ? sevenTvEmote.data?.owner?.display_name ||
        sevenTvEmote.data?.owner?.username
      : twitchClip.data?.creator_name;

  return (
    <Button style={styles.container} onPress={handlePress}>
      <View style={styles.card}>
        {thumbnail && (
          <Image
            useNitro
            trackLoadTime
            trackLoadContext="chat.media-link-card"
            source={thumbnail}
            style={styles.thumbnail}
            contentFit="contain"
          />
        )}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            {getBrandIcon()}
            <Text style={styles.iconName}>{title}</Text>
          </View>
          {createdBy ? <Text>By {createdBy}</Text> : null}
        </View>
        <SymbolView
          name={type === 'twitchClip' ? 'play.rectangle.fill' : 'sparkles'}
          tintColor={theme.colorWhite}
        />
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  brandIconSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    height: 20,
    width: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    flexDirection: 'row',
    padding: theme.space16,
    width: '100%',
  },
  container: {
    marginVertical: theme.space8,
  },
  createdBySkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    height: 13,
    marginTop: 2,
    width: '40%',
  },
  iconName: {
    flex: 1,
    flexShrink: 1,
  },
  info: {
    flex: 1,
  },
  thumbnail: {
    height: 50,
    marginRight: theme.space16,
    width: 50,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space16,
  },
  titleSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    height: 16,
    width: '60%',
  },
});

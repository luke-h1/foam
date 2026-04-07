import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Skeleton } from '@app/components/Skeleton/Skeleton';
import { Text } from '@app/components/Text/Text';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import {
  SEVENTV_EMOTE_LINK_REGEX,
  TWITCH_CHANNEL_CLIP_REGEX,
  TWITCH_CLIP_REGEX,
  TwitchAnd7TVVariant,
} from '@app/utils/chat/replaceTextWithEmotes';
import { useQueries } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';

type MediaLinkCardProps = {
  type: TwitchAnd7TVVariant;
  url: string;
};

export function MediaLinkCard({ type, url }: MediaLinkCardProps) {
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
          const twitchClipMatch = url.match(TWITCH_CLIP_REGEX);
          const twitchChannelClipMatch = url.match(TWITCH_CHANNEL_CLIP_REGEX);
          const clipId =
            twitchClipMatch?.[1] ?? twitchChannelClipMatch?.[1] ?? '';
          return twitchService.getClip(clipId);
        },
        enabled: type === 'twitchClip',
      },
    ],
  });

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
    type === 'stvEmote' ? sevenTvEmote.data?.name : twitchClip.data?.title;

  const createdBy =
    type === 'stvEmote'
      ? sevenTvEmote.data?.owner?.display_name ||
        sevenTvEmote.data?.owner?.username
      : twitchClip.data?.creator_name;

  return (
    <Button style={styles.container} onPress={() => {}}>
      <View style={styles.card}>
        {thumbnail && (
          <Image
            useNitro
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
          <Text>By {createdBy}</Text>
        </View>
        <Icon icon="external-link" />
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  brandIconSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    height: 20,
    width: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.accentAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    padding: theme.spacing.md,
    width: '100%',
  },
  container: {
    marginVertical: theme.spacing.xs,
  },
  createdBySkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
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
    marginRight: theme.spacing.md,
    width: 50,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  titleSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    height: 16,
    width: '60%',
  },
});

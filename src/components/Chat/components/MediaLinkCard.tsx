import { BrandIcon } from '@app/components/BrandIcon';
import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Image } from '@app/components/Image';
import { Skeleton } from '@app/components/Skeleton';
import { Text } from '@app/components/Text';
import { sevenTvService, twitchService } from '@app/services';
import {
  SEVENTV_EMOTE_LINK_REGEX,
  TWITCH_CHANNEL_CLIP_REGEX,
  TWITCH_CLIP_REGEX,
  TwitchAnd7TVVariant,
} from '@app/utils';
import { useQueries } from '@tanstack/react-query';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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
          console.log('url ->', url);
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

  console.log('type ->', type);

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
      ? sevenTvEmote.data?.owner.display_name ||
        sevenTvEmote.data?.owner.username
      : twitchClip.data?.creator_name;

  console.log(sevenTvEmote.data);

  return (
    <Button style={styles.container} onPress={() => {}}>
      <View style={styles.card}>
        {thumbnail && (
          <Image
            source={thumbnail}
            style={styles.thumbnail}
            contentFit="contain"
          />
        )}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            {getBrandIcon()}
            <Text color="text" style={{ flex: 1, flexShrink: 1 }}>
              {title}
            </Text>
          </View>
          <Text>By {createdBy}</Text>
        </View>
        <Icon icon="external-link" />
      </View>
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    marginVertical: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.borderFaint,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    width: '100%',
  },
  thumbnail: {
    width: 50,
    height: 50,
    marginRight: theme.spacing.md,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.text,
  },
  brandIconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.sm,
  },
  titleSkeleton: {
    width: '60%',
    height: 16,
    borderRadius: theme.radii.sm,
  },
  createdBySkeleton: {
    width: '40%',
    height: 13,
    borderRadius: theme.radii.sm,
    marginTop: 2,
  },
}));

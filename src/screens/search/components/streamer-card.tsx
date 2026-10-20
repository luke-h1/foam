import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image } from '@app/components/image/image';
import { LiveBadge } from '@app/components/live-badge/live-badge';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

interface Props {
  stream: SearchChannelResponse;
}

export const StreamerCard = memo(function StreamerCard({ stream }: Props) {
  const isLive = stream.is_live;

  return (
    <View style={styles.container}>
      <Image
        source={stream.thumbnail_url}
        cacheVariant='thumbnail'
        transition={150}
        style={styles.avatar}
        containerStyle={styles.avatar}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text type='body' weight='semibold' numberOfLines={1}>
            {stream.display_name}
          </Text>
          {isLive && <LiveBadge tone='tinted' />}
        </View>
        {stream.game_name ? (
          <Text type='subhead' color='gray.textLow' numberOfLines={1}>
            {stream.game_name}
          </Text>
        ) : (
          <Text type='subhead' color='gray.textLow' numberOfLines={1}>
            {isLive ? 'Streaming' : 'Offline'}
          </Text>
        )}
      </View>
    </View>
  );
});

StreamerCard.displayName = 'StreamerCard';

const styles = StyleSheet.create({
  avatar: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    height: 48,
    overflow: 'hidden',
    width: 48,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: theme.space16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
});

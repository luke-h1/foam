import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LiveBadge } from '@app/components/LiveBadge/LiveBadge';
import { LiveStreamImage } from '@app/components/LiveStreamImage/LiveStreamImage';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

interface Props {
  stream: SearchChannelResponse;
}

export const StreamerCard = memo(function StreamerCard({ stream }: Props) {
  const isLive = stream.is_live;

  return (
    <View style={styles.container}>
      <LiveStreamImage thumbnail={stream.thumbnail_url} animated size='sm' />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text type='sm' weight='semibold' numberOfLines={1}>
            {stream.display_name}
          </Text>
          {isLive && <LiveBadge tone='tinted' />}
        </View>
        {stream.game_name ? (
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {stream.game_name}
          </Text>
        ) : (
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {isLive
              ? i18next.t('search:streaming')
              : i18next.t('search:offline')}
          </Text>
        )}
      </View>
    </View>
  );
});

StreamerCard.displayName = 'StreamerCard';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
});

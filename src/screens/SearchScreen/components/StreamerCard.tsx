import { LiveStreamImage } from '@app/components/LiveStreamImage/LiveStreamImage';
import { Text } from '@app/components/Text/Text';
import { SearchChannelResponse } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

interface Props {
  stream: SearchChannelResponse;
}

export function StreamerCard({ stream }: Props) {
  const isLive = stream.is_live;

  return (
    <View style={styles.container}>
      <LiveStreamImage thumbnail={stream.thumbnail_url} animated size="sm" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text type="sm" weight="semibold" numberOfLines={1}>
            {stream.display_name}
          </Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <Text type="xxs" style={styles.liveText}>
                LIVE
              </Text>
            </View>
          )}
        </View>
        {stream.game_name ? (
          <Text type="xs" color="gray.textLow" numberOfLines={1}>
            {stream.game_name}
          </Text>
        ) : (
          <Text type="xs" color="gray.textLow" numberOfLines={1}>
            {isLive ? 'Streaming' : 'Offline'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  liveBadge: {
    backgroundColor: theme.colorRedSurface,
    borderColor: theme.colorRedBorder,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: {
    color: theme.colorRed,
    fontWeight: '600',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
});

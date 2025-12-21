import { LiveStreamImage } from '@app/components/LiveStreamImage';
import { Typography } from '@app/components/Typography';
import { SearchChannelResponse } from '@app/services/twitch-service';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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
          <Typography size="sm" fontWeight="semiBold" numberOfLines={1}>
            {stream.display_name}
          </Typography>
          {isLive && (
            <View style={styles.liveBadge}>
              <Typography size="xxs" style={styles.liveText}>
                LIVE
              </Typography>
            </View>
          )}
        </View>
        {stream.game_name ? (
          <Typography size="xs" color="gray.textLow" numberOfLines={1}>
            {stream.game_name}
          </Typography>
        ) : (
          <Typography size="xs" color="gray.textLow" numberOfLines={1}>
            {isLive ? 'Streaming' : 'Offline'}
          </Typography>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  liveBadge: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
}));

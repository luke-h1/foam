import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { Badge } from '@app/components/ui/Badge/Badge';
import { theme } from '@app/styles/themes';
import type { ChannelPredictionState } from '@app/types/twitch/prediction';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface ChannelPredictionCardProps {
  channelLogin: string;
  prediction: ChannelPredictionState;
}

function formatTimeRemaining(
  prediction: ChannelPredictionState,
): string | null {
  if (!prediction.isActive || !prediction.locksAt) {
    return prediction.isLocked ? 'Locked' : null;
  }

  const remainingMs = new Date(prediction.locksAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return 'Locking…';
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')} left`;
  }

  return `${remainingSeconds}s left`;
}

function getOutcomeColor(
  color: ChannelPredictionState['outcomes'][number]['color'],
) {
  switch (color) {
    case 'blue':
      return 'rgba(59, 130, 246, 0.22)';
    case 'pink':
      return 'rgba(236, 72, 153, 0.22)';
    default:
      return 'rgba(161, 161, 170, 0.18)';
  }
}

export function ChannelPredictionCard({
  channelLogin,
  prediction,
}: ChannelPredictionCardProps) {
  const timeRemaining = useMemo(
    () => formatTimeRemaining(prediction),
    [prediction],
  );
  const statusLabel = prediction.isActive
    ? 'Live prediction'
    : prediction.isLocked
      ? 'Prediction locked'
      : prediction.status === 'resolved'
        ? 'Prediction result'
        : 'Prediction canceled';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Badge color="amber" variant="soft">
          {statusLabel}
        </Badge>
        {timeRemaining ? (
          <Text color="gray.textLow" tabular type="xxs" weight="medium">
            {timeRemaining}
          </Text>
        ) : null}
      </View>

      <Text color="gray.text" style={styles.title} type="sm" weight="semibold">
        {prediction.title}
      </Text>

      <View style={styles.outcomeList}>
        {prediction.outcomes.map(outcome => (
          <View key={outcome.id} style={styles.outcomeTrack}>
            <View
              style={[
                styles.outcomeFill,
                {
                  backgroundColor: getOutcomeColor(outcome.color),
                  width: `${Math.max(
                    outcome.percentage,
                    outcome.channelPoints > 0 ? 4 : 0,
                  )}%`,
                },
              ]}
            />
            <View style={styles.outcomeContent}>
              <View style={styles.outcomeLabelRow}>
                <Text
                  color="gray.text"
                  numberOfLines={1}
                  type="xs"
                  weight="medium"
                >
                  {outcome.title}
                </Text>
                {outcome.isWinner ? (
                  <Badge color="green" size="sm" variant="soft">
                    Won
                  </Badge>
                ) : null}
              </View>
              <Text color="gray.textLow" tabular type="xxs" weight="semibold">
                {outcome.percentage}% · {outcome.channelPoints} pts ·{' '}
                {outcome.users} users
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text color="gray.textLow" tabular type="xxs">
          {prediction.totalChannelPoints} total points
        </Text>
        {(prediction.isActive || prediction.isLocked) && (
          <PressableArea
            accessibilityRole="button"
            onPress={() =>
              openLinkInBrowser(`https://www.twitch.tv/${channelLogin}`)
            }
          >
            <Text color="amber.accent" type="xxs" weight="semibold">
              Predict on Twitch
            </Text>
          </PressableArea>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151312',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outcomeContent: {
    gap: 2,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  outcomeFill: {
    borderRadius: 10,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  outcomeLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'space-between',
  },
  outcomeList: {
    gap: theme.space8,
  },
  outcomeTrack: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    lineHeight: 20,
  },
});

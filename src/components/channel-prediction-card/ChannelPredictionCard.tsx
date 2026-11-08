import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ChannelActivityBar,
  ChannelActivityBars,
  ChannelActivityCard,
  ChannelActivityFooter,
  ChannelActivityHeader,
  ChannelActivityTitle,
} from '@app/components/channel-activity-card/ChannelActivityCard';
import { Badge } from '@app/components/ui/badge/Badge';
import { Text } from '@app/components/ui/text/Text';
import { useCountdownLabel } from '@app/hooks/use-countdown-label';
import { theme } from '@app/styles/themes';
import type { ChannelPredictionState } from '@app/types/twitch/prediction';

interface ChannelPredictionCardProps {
  channelLogin: string;
  prediction: ChannelPredictionState;
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

function getStatusLabel(prediction: ChannelPredictionState): string {
  if (prediction.isActive) {
    return 'Live prediction';
  }

  if (prediction.isLocked) {
    return 'Prediction locked';
  }

  return prediction.status === 'resolved'
    ? 'Prediction result'
    : 'Prediction canceled';
}

function ChannelPredictionCardComponent({
  channelLogin,
  prediction,
}: ChannelPredictionCardProps) {
  const countdownLabel = useCountdownLabel(
    prediction.isActive ? prediction.locksAt : undefined,
    'Locking…',
  );

  const lockedLabel = prediction.isLocked ? 'Locked' : null;
  const isOpen = prediction.isActive || prediction.isLocked;

  return (
    <ChannelActivityCard>
      <ChannelActivityHeader timeLabel={countdownLabel ?? lockedLabel}>
        <Badge color='amber' variant='soft'>
          {getStatusLabel(prediction)}
        </Badge>
      </ChannelActivityHeader>
      <ChannelActivityTitle>{prediction.title}</ChannelActivityTitle>
      <ChannelActivityBars>
        {prediction.outcomes.map(outcome => (
          <ChannelActivityBar
            key={outcome.id}
            fillColor={getOutcomeColor(outcome.color)}
            hasVotes={outcome.channelPoints > 0}
            percentage={outcome.percentage}
          >
            <View style={styles.outcomeContent}>
              <View style={styles.outcomeLabelRow}>
                <Text
                  color='gray.text'
                  numberOfLines={1}
                  type='subhead'
                  weight='medium'
                >
                  {outcome.title}
                </Text>
                {outcome.isWinner ? (
                  <Badge color='teal' size='sm' variant='soft'>
                    <Text type='subhead' weight='semibold'>
                      Won
                    </Text>
                  </Badge>
                ) : null}
              </View>
              <Text
                color='gray.textLow'
                tabular
                type='caption'
                weight='semibold'
              >
                {outcome.percentage}% · {outcome.channelPoints} pts ·{' '}
                {outcome.users} users
              </Text>
            </View>
          </ChannelActivityBar>
        ))}
      </ChannelActivityBars>
      <ChannelActivityFooter
        channelLogin={channelLogin}
        totalLabel={`${prediction.totalChannelPoints} total points`}
        twitchLink={
          isOpen ? { label: 'Predict on Twitch', color: 'amber.accent' } : null
        }
      />
    </ChannelActivityCard>
  );
}

export const ChannelPredictionCard = memo(ChannelPredictionCardComponent);

const styles = StyleSheet.create({
  outcomeContent: {
    gap: 2,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  outcomeLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'space-between',
  },
});

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
import type { ChannelPollState } from '@app/types/twitch/poll';

interface ChannelPollCardProps {
  channelLogin: string;
  poll: ChannelPollState;
}

function ChannelPollCardComponent({
  channelLogin,
  poll,
}: ChannelPollCardProps) {
  const timeLabel = useCountdownLabel(
    poll.isActive ? poll.endsAt : undefined,
    'Ending…',
  );

  return (
    <ChannelActivityCard>
      <ChannelActivityHeader timeLabel={timeLabel}>
        <Badge color='purple' variant='soft'>
          {poll.isActive ? 'Live poll' : 'Poll result'}
        </Badge>
        {poll.channelPointsVotingEnabled ? (
          <Badge color='amber' variant='soft'>
            <Text type='subhead' weight='semibold'>
              {`+${poll.channelPointsPerVote} pts / extra vote`}
            </Text>
          </Badge>
        ) : null}
      </ChannelActivityHeader>
      <ChannelActivityTitle>{poll.title}</ChannelActivityTitle>
      <ChannelActivityBars>
        {poll.choices.map(choice => (
          <ChannelActivityBar
            key={choice.id}
            fillColor='rgba(145, 70, 255, 0.20)'
            hasVotes={choice.votes > 0}
            percentage={choice.percentage}
          >
            <View style={styles.choiceContent}>
              <Text
                color='gray.text'
                numberOfLines={1}
                type='subhead'
                weight='medium'
              >
                {choice.title}
              </Text>
              <Text
                color='gray.textLow'
                tabular
                type='caption'
                weight='semibold'
              >
                {choice.percentage}% · {choice.votes}
              </Text>
            </View>
          </ChannelActivityBar>
        ))}
      </ChannelActivityBars>
      <ChannelActivityFooter
        channelLogin={channelLogin}
        totalLabel={`${poll.totalVotes} total votes`}
        twitchLink={
          poll.isActive
            ? { label: 'Vote on Twitch', color: 'violet.accent' }
            : null
        }
      />
    </ChannelActivityCard>
  );
}

export const ChannelPollCard = memo(ChannelPollCardComponent);

const styles = StyleSheet.create({
  choiceContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 30,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
});

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Badge } from '@app/components/ui/Badge/Badge';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';
import type { ChannelPollState } from '@app/types/twitch/poll';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

interface ChannelPollCardProps {
  channelLogin: string;
  poll: ChannelPollState;
}

function formatTimeRemaining(poll: ChannelPollState): string | null {
  if (!poll.isActive || !poll.endsAt) {
    return null;
  }

  const remainingMs = new Date(poll.endsAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return i18next.t('chat:poll.ending');
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')} left`;
  }

  return `${remainingSeconds}s left`;
}

function ChannelPollCardComponent({
  channelLogin,
  poll,
}: ChannelPollCardProps) {
  const timeRemaining = formatTimeRemaining(poll);
  const statusLabel = poll.isActive
    ? i18next.t('chat:poll.live')
    : i18next.t('chat:poll.result');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerMeta}>
          <Badge color='purple' variant='soft'>
            {statusLabel}
          </Badge>
          {poll.channelPointsVotingEnabled ? (
            <Badge color='amber' variant='soft'>
              <Text type='xs' weight='semibold'>
                {`+${poll.channelPointsPerVote} pts / extra vote`}
              </Text>
            </Badge>
          ) : null}
        </View>
        {timeRemaining ? (
          <Text color='gray.textLow' tabular type='xxs' weight='medium'>
            {timeRemaining}
          </Text>
        ) : null}
      </View>

      <Text color='gray.text' style={styles.title} type='sm' weight='semibold'>
        {poll.title}
      </Text>

      <View style={styles.choiceList}>
        {poll.choices.map(choice => (
          <View key={choice.id} style={styles.choiceTrack}>
            <View
              style={[
                styles.choiceFill,
                {
                  width: `${Math.max(
                    choice.percentage,
                    choice.votes > 0 ? 4 : 0,
                  )}%`,
                },
              ]}
            />
            <View style={styles.choiceContent}>
              <Text
                color='gray.text'
                numberOfLines={1}
                type='xs'
                weight='medium'
              >
                {choice.title}
              </Text>
              <Text color='gray.textLow' tabular type='xxs' weight='semibold'>
                {choice.percentage}% · {choice.votes}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text color='gray.textLow' tabular type='xxs'>
          {poll.totalVotes} total votes
        </Text>
        {poll.isActive ? (
          <PressableArea
            accessibilityRole='button'
            onPress={() =>
              openLinkInBrowser(`https://www.twitch.tv/${channelLogin}`)
            }
          >
            <Text color='violet.accent' type='xxs' weight='semibold'>
              Vote on Twitch
            </Text>
          </PressableArea>
        ) : null}
      </View>
    </View>
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
  choiceFill: {
    backgroundColor: 'rgba(145, 70, 255, 0.20)',
    borderRadius: 10,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  choiceList: {
    gap: theme.space8,
  },
  choiceTrack: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  container: {
    backgroundColor: theme.color.surface.dark,
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
  headerMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  title: {
    lineHeight: 20,
  },
});

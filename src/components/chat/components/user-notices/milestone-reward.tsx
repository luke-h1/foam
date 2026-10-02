import { type StyleProp, type TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';

import { styles } from '../chat-message/chat-row.styles';

/**
 * The channel-points reward Twitch attaches to some milestones; absent or
 * unparseable means the milestone carried no reward.
 */
export function MilestoneReward({
  reward,
  style,
}: {
  reward: number;
  style: StyleProp<TextStyle>;
}) {
  if (!Number.isFinite(reward) || reward <= 0) {
    return null;
  }

  return (
    <ChatText style={[style, styles.channelPointsMetaReward]}>
      {`+${reward} ${reward === 1 ? 'point' : 'points'}`}
    </ChatText>
  );
}

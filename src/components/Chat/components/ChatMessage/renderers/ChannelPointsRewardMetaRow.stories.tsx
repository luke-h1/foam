import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { createBaseMessage } from '../richChatMessageStoryFixtures';
import { ChannelPointsRewardMetaRow } from './ChannelPointsRewardMetaRow';

const redemptionUserstate = createBaseMessage([], {
  'msg-param-custom-reward-title': 'Hydrate!',
}).userstate;

const highlightUserstate = createBaseMessage([], {
  'msg-id': 'highlighted-message',
}).userstate;

const meta = {
  title: 'components/Chat/ChatMessage/ChannelPointsRewardMetaRow',
  component: ChannelPointsRewardMetaRow,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ChannelPointsRewardMetaRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RewardRedemption: Story = {
  args: {
    compact: false,
    username: 'TestUser',
    userstate: redemptionUserstate,
  },
};

export const HighlightMyMessage: Story = {
  args: {
    compact: false,
    isHighlightedMessage: true,
    username: 'TestUser',
    userstate: highlightUserstate,
  },
};

export const ModeratedRedemption: Story = {
  args: {
    compact: false,
    moderationNotice: 'timeout',
    username: 'TestUser',
    userstate: redemptionUserstate,
  },
};

import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { PinnedMessageBanner } from './PinnedMessageBanner';

const pinnedMessage: PinnedChatMessageViewModel = {
  messageId: 'pinned-1',
  senderName: 'StreamerMain',
  pinnedByName: 'mod_alice',
  text: 'Drops are enabled for the next two hours, make sure your accounts are linked!',
};

const meta = {
  title: 'components/Chat/PinnedMessageBanner',
  component: PinnedMessageBanner,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onRefresh: { action: 'onRefresh' },
    onUnpin: { action: 'onUnpin' },
  },
} satisfies Meta<typeof PinnedMessageBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Viewer: Story = {
  args: {
    canModerateChat: false,
    onRefresh: () => {},
    onUnpin: () => {},
    pinnedMessage,
    pinnedMessageBusy: false,
  },
};

export const Moderator: Story = {
  args: {
    canModerateChat: true,
    onRefresh: () => {},
    onUnpin: () => {},
    pinnedMessage,
    pinnedMessageBusy: false,
  },
};

export const ModeratorBusy: Story = {
  args: {
    canModerateChat: true,
    onRefresh: () => {},
    onUnpin: () => {},
    pinnedMessage,
    pinnedMessageBusy: true,
  },
};

import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { MentionSpan } from './MentionSpan';

const meta = {
  title: 'components/Chat/ChatMessage/MentionSpan',
  component: MentionSpan,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MentionSpan>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: '@streamer',
  },
};

export const FixedColor: Story = {
  args: {
    content: '@viewer',
    getMentionColor: () => '#1AC9A2',
  },
};

export const HighlightedUser: Story = {
  args: {
    content: '@foamfan',
    effectiveHighlightedUserSet: new Set(['foamfan']),
  },
};

export const MentionsCurrentUser: Story = {
  args: {
    content: '@testuser',
    normalisedCurrentUsername: 'testuser',
  },
};

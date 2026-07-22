import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatViewControls } from './ChatViewControls';

const meta = {
  title: 'components/Chat/ChatViewControls',
  component: ChatViewControls,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#0E0E10', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onClearFilters: { action: 'onClearFilters' },
    onToggleShowOnlyMentions: { action: 'onToggleShowOnlyMentions' },
  },
  args: {
    hasActiveFilters: true,
    showOnlyMentions: false,
    onClearFilters: () => {},
    onToggleShowOnlyMentions: () => {},
  },
} satisfies Meta<typeof ChatViewControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MentionsOnly: Story = {
  args: {
    showOnlyMentions: true,
  },
};

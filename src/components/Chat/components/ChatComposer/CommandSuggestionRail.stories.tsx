import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { CommandSuggestionRail } from './CommandSuggestionRail';

const meta = {
  title: 'components/Chat/ChatComposer/CommandSuggestionRail',
  component: CommandSuggestionRail,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <View style={{ height: 44 }}>
          <Story />
        </View>
      </View>
    ),
  ],
  argTypes: {
    handleCommandSelect: { action: 'handleCommandSelect' },
  },
  args: {
    handleCommandSelect: () => {},
    maxSuggestions: 8,
    searchTerm: '',
  },
} satisfies Meta<typeof CommandSuggestionRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllCommands: Story = {};

export const Filtered: Story = {
  args: {
    searchTerm: 'time',
  },
};

import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { SearchHistoryV2 } from './SearchHistoryV2';

const meta = {
  title: 'components/ui/SearchHistoryV2',
  component: SearchHistoryV2,
  decorators: [
    Story => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onSelectItem: { action: 'Selected!' },
    onClearItem: { action: 'Cleared item!' },
    onClearAll: { action: 'Cleared all!' },
  },
} satisfies Meta<typeof SearchHistoryV2>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    history: ['pokimane', 'lirik', 'just chatting', 'esl_csgo'],
    onSelectItem: () => {},
    onClearItem: () => {},
    onClearAll: () => {},
  },
};

export const SingleEntry: Story = {
  args: {
    history: ['shroud'],
    onSelectItem: () => {},
    onClearItem: () => {},
    onClearAll: () => {},
  },
};

export const FullList: Story = {
  args: {
    history: [
      'pokimane',
      'lirik',
      'just chatting',
      'esl_csgo',
      'valorant',
      'summit1g',
      'speedruns',
      'chess',
      'overflow entry',
    ],
    onSelectItem: () => {},
    onClearItem: () => {},
    onClearAll: () => {},
  },
};

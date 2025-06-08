/* eslint-disable no-undef */
/* eslint-disable no-alert */
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { SearchHistory } from './SearchHistory';

const meta = {
  title: 'components/SearchHistory',
  component: SearchHistory,
  decorators: [
    Story => (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SearchHistory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    results: ['Search 1', 'Search 2', 'Search 3'],
    onClearAll: () => alert('Clear All pressed'),
    onClearItem: (id: string) => alert(`Clear Item ${id} pressed`),
    onSelectItem: (query: string) => alert(`Select Item ${query} pressed`),
  },
};

export const Empty: Story = {
  args: {
    results: [],
    onClearAll: () => alert('Clear All pressed'),
    onClearItem: (id: string) => alert(`Clear Item ${id} pressed`),
    onSelectItem: (query: string) => alert(`Select Item ${query} pressed`),
  },
};

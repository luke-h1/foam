import { useState } from 'react';
import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { EmoteSearchFilter } from './EmoteSearchFilter';

const meta = {
  title: 'components/Chat/EmoteSheet/EmoteSearchFilter',
  component: EmoteSearchFilter,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onSubmitEditing: { action: 'onSubmitEditing' },
  },
} satisfies Meta<typeof EmoteSearchFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

function InteractiveSearchFilter({ placeholder }: { placeholder?: string }) {
  const [value, setValue] = useState('');

  return (
    <EmoteSearchFilter
      placeholder={placeholder}
      value={value}
      onChange={setValue}
      rightOnPress={() => setValue('')}
    />
  );
}

export const Empty: Story = {
  args: {
    placeholder: 'Search emotes',
  },
  render: args => <InteractiveSearchFilter placeholder={args.placeholder} />,
};

export const WithValue: Story = {
  args: {
    placeholder: 'Search emotes',
    value: 'catJAM',
    rightOnPress: () => {},
  },
};

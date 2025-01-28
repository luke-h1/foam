import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Tags } from './Tags';

const meta = {
  title: 'components/Tags',
  component: Tags,
  decorators: [
    Story => (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Tags>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
  },
};

export const LimitedTags: Story = {
  args: {
    tags: [
      'tag1',
      'tag2',
      'tag3',
      'tag4',
      'tag5',
      'tag6',
      'tag7',
      'tag8',
      'tag9',
      'tag10',
      'tag11',
    ],
    limit: 10,
  },
};

export const NoTags: Story = {
  args: {
    tags: [],
    limit: 5,
  },
};

import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Text } from './Text';

const meta = {
  title: 'components/ui/Text',
  component: Text,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog',
  },
};

export const Title: Story = {
  args: {
    children: 'Followed channels',
    type: 'title',
    weight: 'bold',
  },
};

export const CaptionItalic: Story = {
  args: {
    children: 'Streaming since 2016',
    type: 'caption',
    italic: true,
    color: 'gray.textLow',
  },
};

export const Display: Story = {
  args: {
    children: 'Foam',
    type: '4xl',
    variant: 'display',
  },
};

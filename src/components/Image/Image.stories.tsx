import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Image } from './Image';

const meta = {
  title: 'components/Image',
  component: Image,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Image>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    source: 'https://placecats.com/640/360',
    style: { width: 320, height: 180, borderRadius: 12 },
  },
};

export const Avatar: Story = {
  args: {
    source: { uri: 'https://placecats.com/300/300' },
    style: { width: 96, height: 96, borderRadius: 48 },
    containerStyle: { borderRadius: 48, overflow: 'hidden' },
  },
};

export const ContainFit: Story = {
  args: {
    source: 'https://placecats.com/480/480',
    contentFit: 'contain',
    style: { width: 320, height: 180, backgroundColor: '#1C1C1E' },
  },
};

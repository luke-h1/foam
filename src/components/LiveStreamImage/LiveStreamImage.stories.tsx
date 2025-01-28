import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { LiveStreamImage } from './LiveStreamImage';

const meta = {
  title: 'components/LiveStreamImage',
  component: LiveStreamImage,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof LiveStreamImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
    thumbnail: 'https://placecats.com/bella/300/200',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    thumbnail: 'https://placecats.com/bella/300/200',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    thumbnail: 'https://placecats.com/bella/300/200',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    thumbnail: 'https://placecats.com/bella/300/200',
  },
};

export const Animated: Story = {
  args: {
    size: 'md',
    animated: true,
    thumbnail: 'https://placecats.com/bella/300/200',
  },
};

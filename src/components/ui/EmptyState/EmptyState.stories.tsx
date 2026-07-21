import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { EmptyState } from './EmptyState';

const meta = {
  title: 'components/ui/EmptyState',
  component: EmptyState,
  decorators: [
    Story => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    buttonOnPress: { action: 'Button pressed!' },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomCopy: Story = {
  args: {
    iconName: 'magnifyingglass',
    heading: 'No results found',
    content: 'Try searching for a different channel or category.',
    button: 'Try again',
  },
};

export const WithImage: Story = {
  args: {
    imageSource: 'https://placecats.com/224/224',
    heading: 'No followed channels',
    content: 'Channels you follow will show up here.',
    button: null,
  },
};

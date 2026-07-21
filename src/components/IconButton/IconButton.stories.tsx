import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { IconButton } from './IconButton';

const meta = {
  title: 'components/IconButton',
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <IconButton icon='heart' label='Follow' onPress={() => {}} />,
};

export const CustomSymbol: Story = {
  render: () => (
    <IconButton
      icon={{
        type: 'symbol',
        name: 'heart.fill',
        color: '#e91e63',
        size: 24,
      }}
      label='Unfollow'
      onPress={() => {}}
    />
  ),
};

export const Large: Story = {
  render: () => (
    <IconButton
      icon='gearshape'
      label='Settings'
      size='xl'
      onPress={() => {}}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <IconButton icon='heart' label='Follow' loading onPress={() => {}} />
  ),
};

import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { IconButtonIcon } from './IconButtonIcon';

const meta = {
  title: 'components/IconButtonIcon',
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
  render: () => <IconButtonIcon icon='heart' />,
};

export const CustomSymbol: Story = {
  render: () => (
    <IconButtonIcon
      icon={{
        type: 'symbol',
        name: 'trash.fill',
        color: '#ef5350',
        size: 28,
      }}
    />
  ),
};

export const Loading: Story = {
  render: () => <IconButtonIcon icon='heart' loading />,
};

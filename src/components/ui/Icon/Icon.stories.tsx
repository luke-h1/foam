import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { SymbolView } from './Icon';

const meta = {
  title: 'components/ui/Icon',
  decorators: [
    Story => (
      <View style={{ padding: 16, alignItems: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <SymbolView name='heart.fill' size={24} tintColor='#ffffff' />,
};

export const Tinted: Story = {
  render: () => (
    <SymbolView name='checkmark.seal.fill' size={24} tintColor='#29b6f6' />
  ),
};

export const Large: Story = {
  render: () => <SymbolView name='gearshape' size={48} tintColor='#ffffff' />,
};

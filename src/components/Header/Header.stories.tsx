/* eslint-disable no-alert */
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Header } from './Header';

const meta = {
  title: 'components/Header',
  component: Header,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Header',
  },
};

// export const WithLeftIcon: Story = {
//   args: {
//     title: 'Header with Left Icon',
//     leftIcon: 'arrow-back',
//     onLeftPress: () => alert('Left icon pressed'),
//   },
// };

// export const WithRightIcon: Story = {
//   args: {
//     title: 'Header with Right Icon',
//     rightIcon: 'menu',
//     onRightPress: () => alert('Right icon pressed'),
//   },
// };

// export const WithBothIcons: Story = {
//   args: {
//     title: 'Header with Both Icons',
//     leftIcon: 'arrow-back',
//     onLeftPress: () => alert('Left icon pressed'),
//     rightIcon: 'menu',
//     onRightPress: () => alert('Right icon pressed'),
//   },
// };

// export const WithCustomLeftAction: Story = {
//   args: {
//     title: 'Header with Custom Left Action',
//     LeftActionComponent: (
//       <View style={{ padding: 10, backgroundColor: 'red' }} />
//     ),
//   },
// };

// export const WithCustomRightAction: Story = {
//   args: {
//     title: 'Header with Custom Right Action',
//     RightActionComponent: (
//       <View style={{ padding: 10, backgroundColor: 'blue' }} />
//     ),
//   },
// };

import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { BottomSheetSurface } from './BottomSheetSurface';

const meta = {
  title: 'components/BottomSheetSurface',
  component: BottomSheetSurface,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <View style={{ height: 240, width: '100%' }}>
          <Story />
        </View>
      </View>
    ),
  ],
} satisfies Meta<typeof BottomSheetSurface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import { useEffect } from 'react';
import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';
import { onlineManager } from '@tanstack/react-query';

import { OfflineBanner } from './OfflineBanner';

const meta = {
  title: 'components/OfflineBanner',
  component: OfflineBanner,
  decorators: [
    Story => {
      useEffect(() => {
        onlineManager.setOnline(false);
        return () => onlineManager.setOnline(true);
      }, []);

      return (
        <View style={{ flex: 1 }}>
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof OfflineBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Offline: Story = {};

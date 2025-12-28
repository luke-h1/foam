import { TrueSheet } from '@lodev09/react-native-true-sheet';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsSheet } from './SettingsSheet';

const meta = {
  title: 'components/Chat/SettingsSheet',
  component: SettingsSheet,
  decorators: [
    Story => (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: '#0E0E10',
            justifyContent: 'flex-end',
          }}
        >
          <Story />
        </View>
      </SafeAreaProvider>
    ),
  ],
  argTypes: {
    onRefetchEmotes: { action: 'onRefetchEmotes' },
    onReconnect: { action: 'onReconnect' },
    onRefreshVideo: { action: 'onRefreshVideo' },
  },
} satisfies Meta<typeof SettingsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

// Helper component to control sheet visibility
function SheetWrapper({ children }: { children: React.ReactNode }) {
  const sheetRef = useRef<TrueSheet>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      void sheetRef.current?.present();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {React.isValidElement(children)
        ? // @ts-expect-error - ref is not a prop of the children
          React.cloneElement(children as React.ReactElement, { ref: sheetRef })
        : children}
    </View>
  );
}

export const Default: Story = {
  args: {
    latency: null,
    reconnectionAttempts: 0,
  },
  render: args => (
    <SheetWrapper>
      <SettingsSheet {...args} />
    </SheetWrapper>
  ),
};

export const WithLatency: Story = {
  args: {
    latency: 45,
    reconnectionAttempts: 0,
  },
  render: args => (
    <SheetWrapper>
      <SettingsSheet {...args} />
    </SheetWrapper>
  ),
};

export const WithReconnectionAttempts: Story = {
  args: {
    latency: 32,
    reconnectionAttempts: 3,
  },
  render: args => (
    <SheetWrapper>
      <SettingsSheet {...args} />
    </SheetWrapper>
  ),
};

export const AllData: Story = {
  args: {
    latency: 67,
    reconnectionAttempts: 5,
  },
  render: args => (
    <SheetWrapper>
      <SettingsSheet {...args} />
    </SheetWrapper>
  ),
};

export const NoLatency: Story = {
  args: {
    latency: null,
    reconnectionAttempts: 2,
  },
  render: args => (
    <SheetWrapper>
      <SettingsSheet {...args} />
    </SheetWrapper>
  ),
};

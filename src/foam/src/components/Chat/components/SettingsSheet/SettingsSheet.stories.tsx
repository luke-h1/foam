import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { SettingsSheet, type SettingsSheetProps } from './SettingsSheet';

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
  args: {
    isPresented: false,
    onDismiss: () => {},
  },
} satisfies Meta<typeof SettingsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetWrapperProps = Omit<SettingsSheetProps, 'isPresented' | 'onDismiss'>;

function SheetWrapper(props: SheetWrapperProps) {
  const [isPresented, setIsPresented] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPresented(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SettingsSheet
        {...props}
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
      />
    </View>
  );
}

function renderSheetStory(args: SettingsSheetProps) {
  const {
    isPresented: _isPresented,
    onDismiss: _onDismiss,
    ...sheetArgs
  } = args;

  return <SheetWrapper {...sheetArgs} />;
}

export const Default: Story = {
  args: {
    reconnectionAttempts: 0,
  },
  render: renderSheetStory,
};

export const WithLatency: Story = {
  args: {
    reconnectionAttempts: 0,
  },
  render: renderSheetStory,
};

export const WithReconnectionAttempts: Story = {
  args: {
    reconnectionAttempts: 3,
  },
  render: renderSheetStory,
};

export const AllData: Story = {
  args: {
    reconnectionAttempts: 5,
  },
  render: renderSheetStory,
};

export const NoLatency: Story = {
  args: {
    reconnectionAttempts: 2,
  },
  render: renderSheetStory,
};

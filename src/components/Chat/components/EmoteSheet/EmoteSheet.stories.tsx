import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { AuthContextTestProvider } from '@app/context/AuthContext';
import { userInfoFixture } from '@app/services/__fixtures__/twitch/userInfo.fixture';

import { EmoteSheet } from './EmoteSheet';

const defaultAuthState = {
  user: userInfoFixture,
  authState: {
    isLoggedIn: true,
    isAnonAuth: false,
    token: {
      accessToken: 'mock-token',
      expiresIn: 3600,
      tokenType: 'bearer',
    },
  },
  loginWithTwitch: () => Promise.resolve(null),
  populateAuthState: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  fetchAnonToken: () => Promise.resolve(),
  ready: true,
};

const meta = {
  title: 'components/Chat/EmoteSheet',
  component: EmoteSheet,
  decorators: [
    Story => (
      <AuthContextTestProvider {...defaultAuthState}>
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
      </AuthContextTestProvider>
    ),
  ],
  argTypes: {
    onEmoteSelect: { action: 'onEmoteSelect' },
  },
  args: {
    isPresented: false,
    onDismiss: () => {},
  },
} satisfies Meta<typeof EmoteSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof EmoteSheet>;

function SheetWrapper(props: Omit<SheetProps, 'isPresented' | 'onDismiss'>) {
  const [isPresented, setIsPresented] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPresented(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <EmoteSheet
        {...props}
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
      />
    </View>
  );
}

function renderSheetStory(args: SheetProps) {
  const {
    isPresented: _isPresented,
    onDismiss: _onDismiss,
    ...sheetArgs
  } = args;

  return <SheetWrapper {...sheetArgs} />;
}

export const Default: Story = {
  render: renderSheetStory,
};

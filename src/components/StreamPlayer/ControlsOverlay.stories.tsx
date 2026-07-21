import { View } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { ControlsOverlay } from './ControlsOverlay';
import type { StreamInfo } from './types';

const overlayOpacity = makeMutable(1);

const streamInfoFixture = {
  gameName: 'Just Chatting',
  startedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
  title: 'late night cozy stream, come hang out',
  userName: 'PixelPirate',
  userLogin: 'pixelpirate',
  viewerCount: 12842,
} satisfies StreamInfo;

const meta = {
  title: 'components/StreamPlayer/ControlsOverlay',
  component: ControlsOverlay,
  decorators: [
    Story => (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Story />
        </View>
      </SafeAreaProvider>
    ),
  ],
  argTypes: {
    onBackPress: { action: 'onBackPress' },
    onCreateClipPress: { action: 'onCreateClipPress' },
    onMutePress: { action: 'onMutePress' },
    onPipPress: { action: 'onPipPress' },
    onPlayPausePress: { action: 'onPlayPausePress' },
    onRefresh: { action: 'onRefresh' },
    onSharePress: { action: 'onSharePress' },
    onSleepTimerPress: { action: 'onSleepTimerPress' },
  },
  args: {
    isVisible: true,
    opacity: overlayOpacity,
    paused: false,
    streamInfo: streamInfoFixture,
    onPlayPausePress: () => {},
  },
} satisfies Meta<typeof ControlsOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playing: Story = {};

export const Paused: Story = {
  args: {
    paused: true,
  },
};

export const MutedWithSleepTimer: Story = {
  args: {
    muted: true,
    sleepTimerActive: true,
  },
};

import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { DebugErrorOverlay } from './DebugErrorOverlay';

const meta = {
  title: 'components/StreamPlayer/DebugErrorOverlay',
  component: DebugErrorOverlay,
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
    onDismiss: { action: 'onDismiss' },
  },
  args: {
    error: {
      statusCode: 502,
      url: 'https://player.twitch.tv/?channel=pixelpirate&parent=www.twitch.tv',
    },
    onDismiss: () => {},
  },
} satisfies Meta<typeof DebugErrorOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongUrl: Story = {
  args: {
    error: {
      statusCode: 403,
      url: 'https://usher.ttvnw.net/api/channel/hls/pixelpirate.m3u8?allow_source=true&fast_bread=true&p=1234567&player_backend=mediaplayer&playlist_include_framerate=true&sig=abcdef',
    },
  },
};

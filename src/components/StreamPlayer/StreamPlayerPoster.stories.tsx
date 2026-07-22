import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { StreamPlayerPoster } from './StreamPlayerPoster';

const meta = {
  title: 'components/StreamPlayer/StreamPlayerPoster',
  component: StreamPlayerPoster,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <View style={{ aspectRatio: 16 / 9, width: '100%' }}>
          <Story />
        </View>
      </View>
    ),
  ],
  args: {
    visible: true,
    posterUrl: 'https://placecats.com/640/360',
  },
} satisfies Meta<typeof StreamPlayerPoster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPoster: Story = {};

export const WithoutPoster: Story = {
  args: {
    posterUrl: undefined,
  },
};

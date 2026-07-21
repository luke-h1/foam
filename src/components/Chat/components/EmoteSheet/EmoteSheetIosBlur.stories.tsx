import { Text, View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { EmoteSheetIosBlur } from './EmoteSheetIosBlur';

const meta = {
  title: 'components/Chat/EmoteSheet/EmoteSheetIosBlur',
  component: EmoteSheetIosBlur,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <View
          style={{
            borderRadius: 16,
            height: 120,
            overflow: 'hidden',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#9147FF',
              height: 60,
              left: 24,
              position: 'absolute',
              top: 12,
              width: 160,
            }}
          />
          <View
            style={{
              backgroundColor: '#2E86FF',
              height: 60,
              position: 'absolute',
              right: 24,
              top: 48,
              width: 160,
            }}
          />
          <Story />
          <Text style={{ color: '#FFF', textAlign: 'center' }}>
            Content above the blur
          </Text>
        </View>
      </View>
    ),
  ],
} satisfies Meta<typeof EmoteSheetIosBlur>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

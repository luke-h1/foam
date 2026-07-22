import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatInputSection } from './ChatInputSection';
import type { ReplyToData } from './chatInputSectionTypes';

const replyToFixture = {
  messageId: 'msg-1',
  username: 'PixelPirate',
  message: 'have you seen the new 7TV emotes yet?',
  replyParentUserLogin: 'pixelpirate',
  parentMessage: 'have you seen the new 7TV emotes yet?',
  color: '#FF69B4',
} satisfies ReplyToData;

const meta = {
  title: 'components/Chat/ChatInputSection',
  component: ChatInputSection,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'flex-end',
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onChangeText: { action: 'onChangeText' },
    onSubmit: { action: 'onSubmit' },
    onOpenEmoteSheet: { action: 'onOpenEmoteSheet' },
    onOpenSettingsSheet: { action: 'onOpenSettingsSheet' },
    onClearReply: { action: 'onClearReply' },
  },
  args: {
    connection: {
      isAuthenticated: true,
      isConnected: true,
      isSending: false,
    },
    messageInput: '',
    replyTo: null,
    onChangeText: () => {},
    onSubmit: () => {},
    onOpenEmoteSheet: () => {},
    onOpenSettingsSheet: () => {},
    onClearReply: () => {},
  },
} satisfies Meta<typeof ChatInputSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const SignedOut: Story = {
  args: {
    connection: {
      isAuthenticated: false,
      isConnected: true,
      isSending: false,
    },
  },
};

export const ReplyingTo: Story = {
  args: {
    replyTo: replyToFixture,
  },
};

export const UploadingImage: Story = {
  args: {
    onAttachImage: () => {},
    isUploadingImage: true,
  },
};

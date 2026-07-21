import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { CHAT_NOTICE_ACCENTS } from '@app/components/Chat/components/util/chatNoticeAccents';

import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';

const meta = {
  title: 'components/Chat/ChatMessage/ChatNoticeMetaRow',
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Announcement: Story = {
  render: () => (
    <ChatNoticeMetaRow
      icon='megaphone.fill'
      label='Announcement'
      labelColor={CHAT_NOTICE_ACCENTS.announcement}
    />
  ),
};

export const FirstMessage: Story = {
  render: () => (
    <ChatNoticeMetaRow
      icon='sparkles'
      label='First message'
      labelColor={CHAT_NOTICE_ACCENTS.firstMessage}
    />
  ),
};

export const Raid: Story = {
  render: () => (
    <ChatNoticeMetaRow
      icon='person.3.fill'
      label='Raid'
      labelColor={CHAT_NOTICE_ACCENTS.raid}
    />
  ),
};

export const Compact: Story = {
  render: () => (
    <ChatNoticeMetaRow
      compact
      icon='gift.fill'
      label='Channel Points reward'
      labelColor={CHAT_NOTICE_ACCENTS.channelPoints}
    />
  ),
};

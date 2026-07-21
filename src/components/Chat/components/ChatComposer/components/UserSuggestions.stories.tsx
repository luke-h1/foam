import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ChatUser } from '@app/store/chat/types/constants';

import { UserSuggestions } from './UserSuggestions';

const userFixtures = [
  {
    name: '@pixelpirate',
    color: '#FF69B4',
    avatar: null,
    userId: '1001',
  },
  {
    name: '@stream_sniper',
    color: '#1E90FF',
    avatar: null,
    userId: '1002',
  },
  {
    name: '@moss_mod',
    color: '#2ECC71',
    avatar: null,
    userId: '1003',
  },
] satisfies ChatUser[];

const meta = {
  title: 'components/Chat/ChatComposer/UserSuggestions',
  component: UserSuggestions,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    handleUserSelect: { action: 'handleUserSelect' },
  },
  args: {
    users: userFixtures,
    showUserSuggestions: true,
    handleUserSelect: () => {},
  },
} satisfies Meta<typeof UserSuggestions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleUser: Story = {
  args: {
    users: userFixtures.slice(0, 1),
  },
};

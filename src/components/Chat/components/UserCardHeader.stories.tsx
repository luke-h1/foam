import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { twitchKeys } from '@app/lib/react-query/query-keys';
import { userInfoFixture } from '@app/services/__fixtures__/twitch/userInfo.fixture';

import { UserCardHeader } from './UserCardHeader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

queryClient.setQueryData(twitchKeys.user('testuser'), userInfoFixture);

const meta = {
  title: 'components/Chat/UserCardHeader',
  component: UserCardHeader,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
          <Story />
        </View>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof UserCardHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    username: 'TestUser',
    login: 'testuser',
    fallbackColor: '#FF4500',
  },
};

export const DifferentLoginAndDisplayName: Story = {
  args: {
    username: '테스트유저',
    login: 'testuser',
    fallbackColor: '#1E90FF',
  },
};

export const NoUserData: Story = {
  args: {
    username: 'UnknownUser',
    login: 'unknownuser',
    fallbackColor: '#9ACD32',
  },
};

import { AuthContextTestProvider } from '@app/context/AuthContext';
import { twitchQueries } from '@app/queries/twitchQueries';
import {
  userInfoFixture,
  userBlockListFixture,
  manyUserBlockListFixture,
} from '@app/services/__fixtures__/twitch';
import { UserBlockList } from '@app/services/twitch-service';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { BlockedUsersScreen } from './BlockedUsersScreen';

const createQueryClient = (data: { data: UserBlockList[] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        queryFn: ({ queryKey }) => {
          if (queryKey[0] === 'blockList') {
            return Promise.resolve(data);
          }
          return Promise.reject(
            new Error(`No mock data for query: ${String(queryKey[0])}`),
          );
        },
      },
    },
  });

  // Pre-populate the cache
  const query = twitchQueries.getUserBlockList({
    broadcasterId: userInfoFixture.id,
  });
  queryClient.setQueryData(query.queryKey, data);

  return queryClient;
};

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
  title: 'screens/Preferences/BlockedUsersScreen',
  component: BlockedUsersScreen,
  decorators: [
    Story => {
      const queryClient = createQueryClient({ data: userBlockListFixture });

      return (
        <QueryClientProvider client={queryClient}>
          <AuthContextTestProvider {...defaultAuthState}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <Story />
            </View>
          </AuthContextTestProvider>
        </QueryClientProvider>
      );
    },
  ],
  argTypes: {},
} satisfies Meta<typeof BlockedUsersScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithBlockedUsers: Story = {};

export const Empty: Story = {
  decorators: [
    Story => {
      const queryClient = createQueryClient({ data: [] });

      return (
        <QueryClientProvider client={queryClient}>
          <AuthContextTestProvider {...defaultAuthState}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <Story />
            </View>
          </AuthContextTestProvider>
        </QueryClientProvider>
      );
    },
  ],
};

export const SingleUser: Story = {
  decorators: [
    Story => {
      const queryClient = createQueryClient({
        data: userBlockListFixture[0] ? [userBlockListFixture[0]] : [],
      });

      return (
        <QueryClientProvider client={queryClient}>
          <AuthContextTestProvider {...defaultAuthState}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <Story />
            </View>
          </AuthContextTestProvider>
        </QueryClientProvider>
      );
    },
  ],
};

export const ManyUsers: Story = {
  decorators: [
    Story => {
      const queryClient = createQueryClient({ data: manyUserBlockListFixture });

      return (
        <QueryClientProvider client={queryClient}>
          <AuthContextTestProvider {...defaultAuthState}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <Story />
            </View>
          </AuthContextTestProvider>
        </QueryClientProvider>
      );
    },
  ],
};

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  UserInfoResponse,
  SearchChannelResponse,
  PaginatedList,
  TwitchStream,
} from '@app/services/twitch-service';
import { mockStreams } from './streams';

export const mockUsers: UserInfoResponse[] = [
  {
    id: '123456',
    login: 'blueberry42',
    display_name: 'Blueberry42',
    type: '',
    broadcaster_type: 'partner',
    description: 'Welcome to my channel!',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 500000000,
    created_at: '2014-09-12T23:50:05Z',
  },
  {
    id: '234567',
    login: 'mango_toast',
    display_name: 'Mango_Toast',
    type: '',
    broadcaster_type: 'partner',
    description: 'Thanks for stopping by!',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 250000000,
    created_at: '2013-06-05T21:15:44Z',
  },
  {
    id: '345678',
    login: 'kiwi_sandwich',
    display_name: 'Kiwi_Sandwich',
    type: '',
    broadcaster_type: 'partner',
    description: 'Hello!',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 450000000,
    created_at: '2011-06-22T02:16:56Z',
  },
  {
    id: '456789',
    login: 'purple_lamp77',
    display_name: 'Purple_Lamp77',
    type: '',
    broadcaster_type: 'partner',
    description: 'Hi there!',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 550000000,
    created_at: '2011-02-05T15:34:19Z',
  },
  {
    id: '567890',
    login: 'orange_cloud',
    display_name: 'Orange_Cloud',
    type: '',
    broadcaster_type: 'partner',
    description: 'Streaming stuff.',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 300000000,
    created_at: '2018-03-15T18:24:12Z',
  },
  {
    id: '678901',
    login: 'red_bicycle',
    display_name: 'Red_Bicycle',
    type: '',
    broadcaster_type: 'partner',
    description: 'Welcome!',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 150000000,
    created_at: '2012-08-20T14:22:33Z',
  },
  {
    id: '999999',
    login: 'testuser',
    display_name: 'TestUser',
    type: '',
    broadcaster_type: 'affiliate',
    description: 'Test account.',
    profile_image_url: 'https://via.placeholder.com/300',
    offline_image_url: '',
    view_count: 1000,
    created_at: '2020-01-01T00:00:00Z',
  },
];

export const getUserByLogin = (login: string): UserInfoResponse | undefined => {
  return mockUsers.find(u => u.login.toLowerCase() === login.toLowerCase());
};

export const getUserById = (id: string): UserInfoResponse | undefined => {
  return mockUsers.find(u => u.id === id);
};

export const getUserImage = (login: string): string | undefined => {
  const user = getUserByLogin(login);
  return user?.profile_image_url;
};

export const searchChannels = (query: string): SearchChannelResponse[] => {
  const matchingUsers = mockUsers.filter(
    u =>
      u.login.toLowerCase().includes(query.toLowerCase()) ||
      u.display_name.toLowerCase().includes(query.toLowerCase()),
  );

  return matchingUsers.map(user => {
    const stream = mockStreams.find(s => s.user_id === user.id);
    return {
      broadcaster_language: 'en',
      broadcaster_login: user.login,
      display_name: user.display_name,
      game_id: stream?.game_id || '',
      game_name: stream?.game_name || '',
      id: user.id,
      is_live: !!stream,
      tag_ids: [],
      tags: stream?.tags || [],
      thumbnail_url: user.profile_image_url,
      title: stream?.title || '',
      started_at: stream?.started_at || '',
    };
  });
};

export const getFollowedStreams = (
  _userId: string,
): PaginatedList<TwitchStream> => {
  // Return first 3 streams as "followed" streams
  return {
    data: mockStreams.slice(0, 3),
    pagination: undefined,
  };
};

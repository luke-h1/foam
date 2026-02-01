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
    login: 'xqc',
    display_name: 'xQc',
    type: '',
    broadcaster_type: 'partner',
    description:
      'Professional Overwatch player turned full-time streamer. Welcome to the jungle!',
    profile_image_url:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-300x300.jpeg',
    offline_image_url: '',
    view_count: 500000000,
    created_at: '2014-09-12T23:50:05Z',
  },
  {
    id: '234567',
    login: 'pokimane',
    display_name: 'Pokimane',
    type: '',
    broadcaster_type: 'partner',
    description: 'Variety streamer & content creator 💕',
    profile_image_url:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-2f93af62e9d5c3e3-300x300.jpeg',
    offline_image_url: '',
    view_count: 250000000,
    created_at: '2013-06-05T21:15:44Z',
  },
  {
    id: '345678',
    login: 'shroud',
    display_name: 'shroud',
    type: '',
    broadcaster_type: 'partner',
    description: 'Former CS:GO pro, now full-time streamer.',
    profile_image_url:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/shroud-profile_image-9a4eb0c0e3f3e5e3-300x300.jpeg',
    offline_image_url: '',
    view_count: 450000000,
    created_at: '2011-06-22T02:16:56Z',
  },
  {
    id: '456789',
    login: 'ninja',
    display_name: 'Ninja',
    type: '',
    broadcaster_type: 'partner',
    description:
      'Professional gamer and streamer. Fortnite legend. Family friendly content!',
    profile_image_url:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-878f1a5f7b4df6c6-300x300.jpeg',
    offline_image_url: '',
    view_count: 550000000,
    created_at: '2011-02-05T15:34:19Z',
  },
  {
    id: '567890',
    login: 'hasanabi',
    display_name: 'HasanAbi',
    type: '',
    broadcaster_type: 'partner',
    description: 'Political commentator and variety streamer.',
    profile_image_url:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/hasanabi-profile_image-9c8be7b2ca18c7b0-300x300.jpeg',
    offline_image_url: '',
    view_count: 300000000,
    created_at: '2018-03-15T18:24:12Z',
  },
  {
    id: '678901',
    login: 'tarik',
    display_name: 'tarik',
    type: '',
    broadcaster_type: 'partner',
    description: 'CS Major Champion. Content creator. Professional gamer.',
    profile_image_url:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/tarik-profile_image-a3d0c7c9b2e8e0d8-300x300.jpeg',
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
    description: 'This is a test user account for E2E testing.',
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

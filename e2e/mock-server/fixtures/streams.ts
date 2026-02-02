import { TwitchStream, PaginatedList } from '@app/services/twitch-service';

export const mockStreams: TwitchStream[] = [
  {
    id: '1',
    user_id: '123456',
    user_login: 'blueberry42',
    user_name: 'Blueberry42',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'Hanging out with chat',
    viewer_count: 85000,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_test1-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Gaming'],
    is_mature: false,
  },
  {
    id: '2',
    user_id: '234567',
    user_login: 'mango_toast',
    user_name: 'Mango_Toast',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'cozy stream 🌸 chatting with chat',
    viewer_count: 32000,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_test2-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Cozy'],
    is_mature: false,
  },
  {
    id: '3',
    user_id: '345678',
    user_login: 'kiwi_sandwich',
    user_name: 'Kiwi_Sandwich',
    game_id: '33214',
    game_name: 'Fortnite',
    type: 'live',
    title: 'Playing some games',
    viewer_count: 28000,
    started_at: new Date(Date.now() - 5400000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_test3-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Competitive'],
    is_mature: false,
  },
  {
    id: '4',
    user_id: '456789',
    user_login: 'purple_lamp77',
    user_name: 'Purple_Lamp77',
    game_id: '32982',
    game_name: 'Grand Theft Auto V',
    type: 'live',
    title: 'GTA RP with friends',
    viewer_count: 21000,
    started_at: new Date(Date.now() - 1800000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_test4-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'RP'],
    is_mature: true,
  },
  {
    id: '5',
    user_id: '567890',
    user_login: 'orange_cloud',
    user_name: 'Orange_Cloud',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'Hanging out',
    viewer_count: 45000,
    started_at: new Date(Date.now() - 9000000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_test5-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Variety'],
    is_mature: false,
  },
  {
    id: '6',
    user_id: '678901',
    user_login: 'red_bicycle',
    user_name: 'Red_Bicycle',
    game_id: '32399',
    game_name: 'Counter-Strike',
    type: 'live',
    title: 'Playing CS2',
    viewer_count: 18000,
    started_at: new Date(Date.now() - 4500000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_test6-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Esports'],
    is_mature: false,
  },
];

export const getTopStreamsResponse = (
  cursor?: string,
): PaginatedList<TwitchStream> => {
  const pageSize = 20;
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const streams = [...mockStreams];

  // Duplicate streams to simulate more data
  while (streams.length < startIndex + pageSize) {
    streams.push(
      ...mockStreams.map((s, i) => ({
        ...s,
        id: `${parseInt(s.id, 10) + streams.length + i}`,
        viewer_count: Math.max(100, s.viewer_count - streams.length * 100),
      })),
    );
  }

  const pageStreams = streams.slice(startIndex, startIndex + pageSize);
  const nextCursor =
    startIndex + pageSize < streams.length
      ? String(startIndex + pageSize)
      : undefined;

  return {
    data: pageStreams,
    pagination: nextCursor ? { cursor: nextCursor } : undefined,
  };
};

export const getStreamByLogin = (
  userLogin: string,
): TwitchStream | undefined => {
  return mockStreams.find(
    s => s.user_login.toLowerCase() === userLogin.toLowerCase(),
  );
};

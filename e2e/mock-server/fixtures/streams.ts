import { TwitchStream, PaginatedList } from '@app/services/twitch-service';

export const mockStreams: TwitchStream[] = [
  {
    id: '1',
    user_id: '123456',
    user_login: 'xqc',
    user_name: 'xQc',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'GAMING AND CHATTING | !discord !twitter',
    viewer_count: 85000,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_xqc-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Gaming'],
    is_mature: false,
  },
  {
    id: '2',
    user_id: '234567',
    user_login: 'pokimane',
    user_name: 'Pokimane',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'cozy stream 🌸 chatting with chat',
    viewer_count: 32000,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_pokimane-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Cozy'],
    is_mature: false,
  },
  {
    id: '3',
    user_id: '345678',
    user_login: 'shroud',
    user_name: 'shroud',
    game_id: '33214',
    game_name: 'Fortnite',
    type: 'live',
    title: 'Ranked Grind | !merch !pc',
    viewer_count: 28000,
    started_at: new Date(Date.now() - 5400000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_shroud-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'FPS', 'Competitive'],
    is_mature: false,
  },
  {
    id: '4',
    user_id: '456789',
    user_login: 'ninja',
    user_name: 'Ninja',
    game_id: '32982',
    game_name: 'Grand Theft Auto V',
    type: 'live',
    title: 'GTA RP with the squad!',
    viewer_count: 21000,
    started_at: new Date(Date.now() - 1800000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_ninja-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'RP'],
    is_mature: true,
  },
  {
    id: '5',
    user_id: '567890',
    user_login: 'hasanabi',
    user_name: 'HasanAbi',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'News & Politics | reacting to stuff',
    viewer_count: 45000,
    started_at: new Date(Date.now() - 9000000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_hasanabi-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'Politics', 'News'],
    is_mature: false,
  },
  {
    id: '6',
    user_id: '678901',
    user_login: 'tarik',
    user_name: 'tarik',
    game_id: '32399',
    game_name: 'Counter-Strike',
    type: 'live',
    title: 'CS2 RANKED | Road to Global',
    viewer_count: 18000,
    started_at: new Date(Date.now() - 4500000).toISOString(),
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_tarik-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English', 'FPS', 'Esports'],
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

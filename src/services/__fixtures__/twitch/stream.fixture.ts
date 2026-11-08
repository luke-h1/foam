import type { TwitchStream } from '@app/types/twitch/stream';

export function createTwitchStream(
  overrides: Partial<TwitchStream> = {},
): TwitchStream {
  return {
    id: '1',
    user_id: '100',
    user_login: 'streamer1',
    user_name: 'Streamer1',
    game_id: '509658',
    game_name: 'Just Chatting',
    type: 'live',
    title: 'Test stream',
    viewer_count: 10_000,
    started_at: new Date().toISOString(),
    language: 'en',
    thumbnail_url: 'https://example.com/thumb.jpg',
    tag_ids: [],
    tags: [],
    is_mature: false,
    ...overrides,
  };
}

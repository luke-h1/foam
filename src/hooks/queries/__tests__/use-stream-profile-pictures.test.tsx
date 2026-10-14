import { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { twitchApi } from '@app/services/api/clients';
import type { TwitchStream } from '@app/types/twitch/stream';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { useStreamProfilePictures } from '../use-stream-profile-pictures';

const mockTwitchGet = jest.spyOn(twitchApi, 'get');

/**
 * Answers a batched `/users?id=a&id=b` lookup with one user per id.
 */
async function answerUsersLookup(url: string) {
  const ids = new URLSearchParams(url.split('?')[1]).getAll('id');
  return { data: ids.map(user) };
}

function stream(userId: string): TwitchStream {
  return {
    id: `stream-${userId}`,
    user_id: userId,
    user_login: userId,
    user_name: userId,
    game_id: '1',
    game_name: 'game',
    type: 'live',
    title: 'title',
    viewer_count: 1,
    started_at: '',
    language: 'en',
    thumbnail_url: '',
    tag_ids: [],
    tags: [],
    is_mature: false,
  };
}

function user(id: string): UserInfoResponse {
  return {
    broadcaster_type: '',
    created_at: '',
    description: '',
    display_name: id,
    id,
    login: id,
    offline_image_url: '',
    profile_image_url: `https://cdn/${id}.png`,
    type: '',
    view_count: 0,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useStreamProfilePictures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTwitchGet.mockImplementation(answerUsersLookup);
  });

  test('only queries newly missing ids as the stream list grows', async () => {
    const { result, rerender } = renderHook(
      ({ streams }: { streams: TwitchStream[] }) =>
        useStreamProfilePictures(streams, true),
      {
        initialProps: { streams: [stream('a'), stream('b')] },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.map(s => s.profilePicture)).toEqual([
        'https://cdn/a.png',
        'https://cdn/b.png',
      ]);
    });

    expect(mockTwitchGet.mock.calls).toEqual([['/users?id=a&id=b']]);

    rerender({ streams: [stream('a'), stream('b'), stream('c')] });

    await waitFor(() => {
      expect(result.current.map(s => s.profilePicture)).toEqual([
        'https://cdn/a.png',
        'https://cdn/b.png',
        'https://cdn/c.png',
      ]);
    });

    // The appended page only requests the newly-seen id, not the whole list.
    expect(mockTwitchGet.mock.calls).toEqual([
      ['/users?id=a&id=b'],
      ['/users?id=c'],
    ]);
  });

  test('skips the lookup and returns the input untouched when disabled', () => {
    const streams = [stream('a')];

    const { result } = renderHook(
      () => useStreamProfilePictures(streams, false),
      { wrapper: createWrapper() },
    );

    expect(mockTwitchGet).not.toHaveBeenCalled();
    expect(result.current).toBe(streams);
  });
});

import { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { twitchService } from '@app/services/twitch-service';
import type { TwitchStream } from '@app/types/twitch/stream';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { useStreamProfilePictures } from '../useStreamProfilePictures';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    getUsersById: jest.fn(),
  },
}));

const mockGetUsersById = jest.mocked(twitchService.getUsersById);

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
    mockGetUsersById.mockImplementation(async (ids: string[]) => ids.map(user));
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
    expect(mockGetUsersById).toHaveBeenCalledTimes(1);
    expect(mockGetUsersById).toHaveBeenCalledWith(['a', 'b']);

    rerender({ streams: [stream('a'), stream('b'), stream('c')] });

    await waitFor(() => {
      expect(result.current.map(s => s.profilePicture)).toEqual([
        'https://cdn/a.png',
        'https://cdn/b.png',
        'https://cdn/c.png',
      ]);
    });
    // The appended page only requests the newly-seen id, not the whole list.
    expect(mockGetUsersById).toHaveBeenCalledTimes(2);
    expect(mockGetUsersById).toHaveBeenLastCalledWith(['c']);
  });

  test('skips the lookup and returns the input untouched when disabled', () => {
    const streams = [stream('a')];
    const { result } = renderHook(
      () => useStreamProfilePictures(streams, false),
      { wrapper: createWrapper() },
    );

    expect(mockGetUsersById).not.toHaveBeenCalled();
    expect(result.current).toBe(streams);
  });
});

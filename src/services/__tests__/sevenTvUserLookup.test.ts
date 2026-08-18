import * as sevenTvWorkletClient from '@app/services/gql/sevenTvWorkletClient';
import {
  clearSevenTvUserCache,
  sevenTvService,
} from '@app/services/seventv-service';

import {
  noSevenTvUserResponse,
  sevenTvGqlErrorResponse,
  sevenTvUserResponse,
} from './__fixtures__/sevenTvUserLookup.fixture';

const mockRunCosmeticsQuery = jest.spyOn(
  sevenTvWorkletClient,
  'runCosmeticsQuery',
);

/**
 * Runs the query's real `parse` worklet so the tests cover parsing, not a
 * stubbed return. Reports a throwing parse as an error, like the real client.
 */
const respondWith = (responseText: string) => {
  mockRunCosmeticsQuery.mockImplementation((_query, _variables, parse) => {
    try {
      return Promise.resolve({ result: parse(responseText) });
    } catch (error) {
      return Promise.resolve({
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  });
};

describe('sevenTvService user lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSevenTvUserCache();
  });

  test('reads the active emote set id from the user connection', async () => {
    respondWith(sevenTvUserResponse('stv-1', 'set-1'));

    await expect(sevenTvService.getEmoteSetId('123')).resolves.toEqual('set-1');
  });

  test('resolves the user id and emote set id from a single query', async () => {
    respondWith(sevenTvUserResponse('stv-1', 'set-1'));

    const userId = await sevenTvService.get7tvUserId('123');
    const emoteSetId = await sevenTvService.getEmoteSetId('123');

    expect([userId, emoteSetId]).toEqual(['stv-1', 'set-1']);
    expect(mockRunCosmeticsQuery).toHaveBeenCalledTimes(1);
  });

  test('returns an empty emote set id when the user has no active set', async () => {
    respondWith(sevenTvUserResponse('stv-1', null));

    await expect(sevenTvService.getEmoteSetId('123')).resolves.toEqual('');
  });

  test('returns an empty user id when the Twitch user has no 7TV account', async () => {
    respondWith(noSevenTvUserResponse);

    await expect(sevenTvService.get7tvUserId('123')).resolves.toEqual('');
  });

  /**
   * v3 404'd for these, so `channelLoad` already falls back to the global set
   * on a throw. Resolving to '' instead would query 7TV with an empty set id.
   */
  test('rejects when the Twitch user has no 7TV account', async () => {
    respondWith(noSevenTvUserResponse);

    await expect(sevenTvService.getEmoteSetId('123')).rejects.toThrow(
      'No 7TV user for Twitch user 123',
    );
  });

  /**
   * `channelLoad` catches this to fall back to the cached set id or the global
   * set, so a failed lookup must reject rather than resolve to ''.
   */
  test('rejects when the lookup fails', async () => {
    respondWith(sevenTvGqlErrorResponse);

    await expect(sevenTvService.getEmoteSetId('123')).rejects.toThrow(
      'No 7TV user for Twitch user 123',
    );
  });

  test('returns an empty user id rather than rejecting when the lookup fails', async () => {
    respondWith(sevenTvGqlErrorResponse);

    await expect(sevenTvService.get7tvUserId('123')).resolves.toEqual('');
  });

  test('does not cache a failed lookup', async () => {
    respondWith(sevenTvGqlErrorResponse);
    await expect(sevenTvService.getEmoteSetId('123')).rejects.toThrow();

    respondWith(sevenTvUserResponse('stv-1', 'set-1'));

    await expect(sevenTvService.getEmoteSetId('123')).resolves.toEqual('set-1');
  });
});

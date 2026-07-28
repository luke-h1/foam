import { runCosmeticsQuery } from '@app/services/gql/sevenTvWorkletClient';
import {
  clearSevenTvUserCache,
  sevenTvService,
} from '@app/services/seventv-service';

import {
  noSevenTvUserResponse,
  sevenTvGqlErrorResponse,
  sevenTvUserResponse,
} from './__fixtures__/sevenTvUserLookup.fixture';

jest.mock('@app/services/gql/sevenTvWorkletClient', () => ({
  runCosmeticsQuery: jest.fn(),
}));

const mockRunCosmeticsQuery = jest.mocked(runCosmeticsQuery);

/**
 * Runs the query's real `parse` worklet over `responseText` so the assertions
 * cover the parsing itself, not a stubbed return value. Mirrors how the real
 * client reports a throwing parse as an errored lookup.
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

  test('returns empty ids when the Twitch user has no 7TV account', async () => {
    respondWith(noSevenTvUserResponse);

    const userId = await sevenTvService.get7tvUserId('123');
    const emoteSetId = await sevenTvService.getEmoteSetId('123');

    expect([userId, emoteSetId]).toEqual(['', '']);
  });

  test('surfaces GQL errors as a failed lookup that is not cached', async () => {
    respondWith(sevenTvGqlErrorResponse);

    await expect(sevenTvService.getEmoteSetId('123')).resolves.toEqual('');

    respondWith(sevenTvUserResponse('stv-1', 'set-1'));

    await expect(sevenTvService.getEmoteSetId('123')).resolves.toEqual('set-1');
  });
});

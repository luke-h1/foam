import { sevenTvGqlApi } from '@app/services/api/clients';
import {
  clearSevenTvUserCache,
  sevenTvService,
} from '@app/services/seven-tv-service';

import {
  noSevenTvUserResponse,
  sevenTvGqlErrorResponse,
  sevenTvUserResponse,
} from './__fixtures__/seven-tv-user-lookup.fixture';

const postDerivedSpy = jest.spyOn(sevenTvGqlApi, 'postDerived');

const respondWith = (responseText: string) => {
  postDerivedSpy.mockImplementation((_path, _data, derive) =>
    Promise.resolve(derive(responseText)),
  );
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

    expect(postDerivedSpy).toHaveBeenCalledTimes(1);
  });

  test('returns an empty emote set id when the user has no active set', async () => {
    respondWith(sevenTvUserResponse('stv-1', null));

    await expect(sevenTvService.getEmoteSetId('123')).resolves.toEqual('');
  });

  test('returns an empty user id when the Twitch user has no 7TV account', async () => {
    respondWith(noSevenTvUserResponse);

    await expect(sevenTvService.get7tvUserId('123')).resolves.toEqual('');
  });

  test('rejects when the Twitch user has no 7TV account', async () => {
    respondWith(noSevenTvUserResponse);

    await expect(sevenTvService.getEmoteSetId('123')).rejects.toThrow(
      'No 7TV user for Twitch user 123',
    );
  });

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

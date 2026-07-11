import type { TwitchCheermote } from '@app/types/twitch/bits';

import { clearCheermotes } from '../clearCheermotes';
import { fetchChannelCheermotes } from '../fetchChannelCheermotes';
import { getChannelCheermotes } from '../getChannelCheermotes';
import { makeCheermote } from './__fixtures__/cheermoteStore.fixture';

describe('fetchChannelCheermotes', () => {
  beforeEach(() => {
    clearCheermotes();
  });

  test('fetchChannelCheermotes dedupes in-flight fetches and stores the result', async () => {
    let resolveFetch!: (value: TwitchCheermote[]) => void;
    const first = fetchChannelCheermotes(
      '123',
      () =>
        new Promise<TwitchCheermote[]>(resolve => {
          resolveFetch = resolve;
        }),
    );
    // A second in-flight call must reuse the first fetch, so its own fetcher
    // never runs and never lands its distinct result.
    const second = fetchChannelCheermotes('123', () =>
      Promise.resolve([makeCheermote('Bonk')]),
    );

    resolveFetch([makeCheermote('Cheer')]);
    await first;
    await second;

    const stored = getChannelCheermotes('123');
    expect([...(stored?.keys() ?? [])]).toEqual(['cheer']);
  });

  test('fetchChannelCheermotes does not refetch a stored channel', async () => {
    const fetcher = jest.fn(() => Promise.resolve([makeCheermote('Cheer')]));

    await fetchChannelCheermotes('123', fetcher);
    await fetchChannelCheermotes('123', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('fetchChannelCheermotes allows a retry after a failed fetch', async () => {
    const failing = jest.fn(() => Promise.reject(new Error('network')));

    await expect(fetchChannelCheermotes('123', failing)).rejects.toThrow(
      'network',
    );

    const succeeding = jest.fn(() => Promise.resolve([makeCheermote('Cheer')]));
    await fetchChannelCheermotes('123', succeeding);

    expect(succeeding).toHaveBeenCalledTimes(1);
    expect(getChannelCheermotes('123')?.has('cheer')).toBe(true);
  });
});

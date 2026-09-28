import type { TwitchCheermote } from '@app/types/twitch/bits';

import { clearCheermotes } from '../clear-cheermotes';
import { fetchChannelCheermotes } from '../fetch-channel-cheermotes';
import { getChannelCheermotes } from '../get-channel-cheermotes';
import { makeCheermote } from './__fixtures__/cheermote-store.fixture';

describe('clearCheermotes', () => {
  beforeEach(() => {
    clearCheermotes();
  });

  test('clearCheermotes during an in-flight fetch drops the stale result', async () => {
    let resolveFetch!: (value: TwitchCheermote[]) => void;

    const pending = fetchChannelCheermotes(
      '123',
      () =>
        new Promise<TwitchCheermote[]>(resolve => {
          resolveFetch = resolve;
        }),
    );

    clearCheermotes();
    resolveFetch([makeCheermote('Cheer')]);
    await pending;

    expect(getChannelCheermotes('123')).toBeUndefined();

    const fetcher = jest.fn(() => Promise.resolve([makeCheermote('Cheer')]));
    await fetchChannelCheermotes('123', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

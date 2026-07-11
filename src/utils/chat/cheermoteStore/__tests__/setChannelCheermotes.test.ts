import type { CheermoteTier } from '@app/utils/chat/cheermoteStore/types';

import { clearCheermotes } from '../clearCheermotes';
import { fetchChannelCheermotes } from '../fetchChannelCheermotes';
import { getChannelCheermotes } from '../getChannelCheermotes';
import { setChannelCheermotes } from '../setChannelCheermotes';
import { makeCheermote } from './__fixtures__/cheermoteStore.fixture';

describe('setChannelCheermotes', () => {
  beforeEach(() => {
    clearCheermotes();
  });

  test('stores tiers keyed by lowercased prefix with 2x dark urls', () => {
    setChannelCheermotes('123', [makeCheermote('Cheer')]);

    const cheermotes = getChannelCheermotes('123');
    expect(cheermotes?.get('cheer')).toEqual<CheermoteTier[]>([
      {
        color: '#979797',
        minBits: 1,
        staticUrl: 'https://cdn.example.com/Cheer/1/1.png',
        url: 'https://cdn.example.com/Cheer/1/1.gif',
      },
      {
        color: '#9c3ee8',
        minBits: 100,
        staticUrl: 'https://cdn.example.com/Cheer/100/2.png',
        url: 'https://cdn.example.com/Cheer/100/2.gif',
      },
    ]);
  });

  test('evicts the oldest channel and its fetch guard once at capacity', async () => {
    for (let index = 0; index < 20; index += 1) {
      setChannelCheermotes(`channel-${index}`, [makeCheermote('Cheer')]);
    }

    setChannelCheermotes('channel-20', [makeCheermote('Cheer')]);

    expect(getChannelCheermotes('channel-0')).toBeUndefined();
    expect(getChannelCheermotes('channel-1')?.has('cheer')).toBe(true);
    expect(getChannelCheermotes('channel-20')?.has('cheer')).toBe(true);

    const fetcher = jest.fn(() => Promise.resolve([makeCheermote('Cheer')]));
    await fetchChannelCheermotes('channel-0', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getChannelCheermotes('channel-0')?.has('cheer')).toBe(true);
  });

  test('re-setting an existing channel refreshes its position so eviction takes the oldest untouched channel', () => {
    for (let index = 0; index < 20; index += 1) {
      setChannelCheermotes(`channel-${index}`, [makeCheermote('Cheer')]);
    }

    setChannelCheermotes('channel-0', [makeCheermote('Cheer')]);
    setChannelCheermotes('channel-20', [makeCheermote('Cheer')]);

    expect(getChannelCheermotes('channel-0')?.has('cheer')).toBe(true);
    expect(getChannelCheermotes('channel-1')).toBeUndefined();
    expect(getChannelCheermotes('channel-20')?.has('cheer')).toBe(true);
  });
});

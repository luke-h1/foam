import type { TwitchCheermote } from '@app/types/twitch/bits';

import {
  clearCheermotes,
  getChannelCheermotes,
  markChannelCheermotesFetchFailed,
  markChannelCheermotesFetching,
  resolveCheermoteTier,
  setChannelCheermotes,
  shouldFetchChannelCheermotes,
} from '../cheermoteStore';

function makeCheermote(prefix: string): TwitchCheermote {
  return {
    prefix,
    tiers: [
      {
        min_bits: 1,
        id: '1',
        color: '#979797',
        images: {
          dark: {
            animated: { '1': `https://cdn.example.com/${prefix}/1/1.gif` },
            static: { '1': `https://cdn.example.com/${prefix}/1/1.png` },
          },
          light: { animated: {}, static: {} },
        },
        can_cheer: true,
        show_in_bits_card: true,
      },
      {
        min_bits: 100,
        id: '100',
        color: '#9c3ee8',
        images: {
          dark: {
            animated: {
              '1': `https://cdn.example.com/${prefix}/100/1.gif`,
              '2': `https://cdn.example.com/${prefix}/100/2.gif`,
            },
            static: { '2': `https://cdn.example.com/${prefix}/100/2.png` },
          },
          light: { animated: {}, static: {} },
        },
        can_cheer: true,
        show_in_bits_card: true,
      },
    ],
    type: 'global_first_party',
    order: 1,
    last_updated: '2024-01-01T00:00:00Z',
    is_charitable: false,
  };
}

describe('cheermoteStore', () => {
  beforeEach(() => {
    clearCheermotes();
  });

  test('stores tiers keyed by lowercased prefix with 2x dark urls', () => {
    setChannelCheermotes('123', [makeCheermote('Cheer')]);

    const cheermotes = getChannelCheermotes('123');
    expect(cheermotes?.get('cheer')).toEqual([
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

  test('resolveCheermoteTier picks the highest tier at or below the amount', () => {
    setChannelCheermotes('123', [makeCheermote('Cheer')]);
    const tiers = getChannelCheermotes('123')!.get('cheer')!;

    expect(resolveCheermoteTier(tiers, 1)?.minBits).toEqual(1);
    expect(resolveCheermoteTier(tiers, 99)?.minBits).toEqual(1);
    expect(resolveCheermoteTier(tiers, 100)?.minBits).toEqual(100);
    expect(resolveCheermoteTier(tiers, 25_000)?.minBits).toEqual(100);
  });

  test('resolveCheermoteTier returns undefined below the lowest tier', () => {
    setChannelCheermotes('123', [makeCheermote('Cheer')]);
    const tiers = getChannelCheermotes('123')!.get('cheer')!;

    expect(resolveCheermoteTier(tiers, 0)).toBeUndefined();
  });

  test('fetch guard dedupes inflight fetches and honours completion', () => {
    expect(shouldFetchChannelCheermotes('123')).toEqual(true);

    markChannelCheermotesFetching('123');
    expect(shouldFetchChannelCheermotes('123')).toEqual(false);

    setChannelCheermotes('123', [makeCheermote('Cheer')]);
    expect(shouldFetchChannelCheermotes('123')).toEqual(false);
  });

  test('fetch guard allows a retry after a failed fetch', () => {
    markChannelCheermotesFetching('123');
    markChannelCheermotesFetchFailed('123');

    expect(shouldFetchChannelCheermotes('123')).toEqual(true);
  });
});

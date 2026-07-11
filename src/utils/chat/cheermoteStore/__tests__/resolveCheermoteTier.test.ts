import { clearCheermotes } from '../clearCheermotes';
import { getChannelCheermotes } from '../getChannelCheermotes';
import { resolveCheermoteTier } from '../resolveCheermoteTier';
import { setChannelCheermotes } from '../setChannelCheermotes';
import { makeCheermote } from './__fixtures__/cheermoteStore.fixture';

describe('resolveCheermoteTier', () => {
  beforeEach(() => {
    clearCheermotes();
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
});

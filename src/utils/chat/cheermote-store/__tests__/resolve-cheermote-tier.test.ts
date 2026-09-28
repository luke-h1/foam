import { clearCheermotes } from '../clear-cheermotes';
import { getChannelCheermotes } from '../get-channel-cheermotes';
import { resolveCheermoteTier } from '../resolve-cheermote-tier';
import { setChannelCheermotes } from '../set-channel-cheermotes';
import { makeCheermote } from './__fixtures__/cheermote-store.fixture';

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

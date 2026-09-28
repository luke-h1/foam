import { clearCheermotes } from '../clear-cheermotes';
import { getChannelCheermotes } from '../get-channel-cheermotes';
import { setChannelCheermotes } from '../set-channel-cheermotes';
import { makeCheermote } from './__fixtures__/cheermote-store.fixture';

describe('getChannelCheermotes', () => {
  beforeEach(() => {
    clearCheermotes();
  });

  test('reading a channel refreshes its position so eviction takes the oldest unread channel', () => {
    for (let index = 0; index < 20; index += 1) {
      setChannelCheermotes(`channel-${index}`, [makeCheermote('Cheer')]);
    }

    expect(getChannelCheermotes('channel-0')?.has('cheer')).toBe(true);
    setChannelCheermotes('channel-20', [makeCheermote('Cheer')]);

    expect(getChannelCheermotes('channel-0')?.has('cheer')).toBe(true);
    expect(getChannelCheermotes('channel-1')).toBeUndefined();
    expect(getChannelCheermotes('channel-20')?.has('cheer')).toBe(true);
  });
});

import { clearCheermotes } from '../clearCheermotes';
import { getChannelCheermotes } from '../getChannelCheermotes';
import { setChannelCheermotes } from '../setChannelCheermotes';
import { makeCheermote } from './__fixtures__/cheermoteStore.fixture';

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

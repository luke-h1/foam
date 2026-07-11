import { getNextChatCycleAction } from '../getNextChatCycleAction';

describe('getNextChatCycleAction', () => {
  test('cycles chat visibility through sidebar, overlay, and hidden states', () => {
    expect(getNextChatCycleAction(false, 'sidebar')).toBe('show');
    expect(getNextChatCycleAction(true, 'sidebar')).toBe('overlay');
    expect(getNextChatCycleAction(true, 'overlay')).toBe('hide');
  });
});

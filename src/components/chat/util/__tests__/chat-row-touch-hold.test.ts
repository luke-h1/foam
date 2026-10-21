import {
  beginRowTouchHold,
  isRowTouchHeld,
} from '@app/components/chat/util/chat-row-touch-hold';

describe('chat row touch hold', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('stays held until every hold is released', () => {
    const releaseFirst = beginRowTouchHold();
    const releaseSecond = beginRowTouchHold();

    releaseFirst();
    const heldAfterFirst = isRowTouchHeld();

    releaseSecond();

    expect([heldAfterFirst, isRowTouchHeld()]).toEqual([true, false]);
  });

  test('ignores a second release of the same hold', () => {
    const releaseFirst = beginRowTouchHold();
    const releaseSecond = beginRowTouchHold();

    releaseFirst();
    releaseFirst();
    const heldAfterRepeat = isRowTouchHeld();

    releaseSecond();

    expect(heldAfterRepeat).toBe(true);
  });

  test('drops a hold whose touch end never arrived', () => {
    jest.useFakeTimers();
    beginRowTouchHold();

    jest.advanceTimersByTime(5000);
    const heldAtLimit = isRowTouchHeld();

    jest.advanceTimersByTime(1);

    expect([heldAtLimit, isRowTouchHeld()]).toEqual([true, false]);
  });
});

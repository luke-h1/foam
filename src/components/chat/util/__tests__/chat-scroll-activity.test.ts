import { chatScrollActivity } from '@app/components/chat/util/chat-scroll-activity';

describe('chatScrollActivity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    chatScrollActivity.reset();
  });

  afterEach(() => {
    chatScrollActivity.reset();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('poke marks active, then settles to inactive after the quiet window', () => {
    expect(chatScrollActivity.isActive()).toBe(false);

    chatScrollActivity.poke();
    expect(chatScrollActivity.isActive()).toBe(true);

    jest.advanceTimersByTime(149);
    expect(chatScrollActivity.isActive()).toBe(true);

    jest.advanceTimersByTime(1);
    expect(chatScrollActivity.isActive()).toBe(false);
  });

  test('repeated pokes keep it active until the final quiet window elapses', () => {
    chatScrollActivity.poke();
    jest.advanceTimersByTime(100);
    chatScrollActivity.poke();
    jest.advanceTimersByTime(100);
    expect(chatScrollActivity.isActive()).toBe(true);

    jest.advanceTimersByTime(50);
    expect(chatScrollActivity.isActive()).toBe(false);
  });

  test('arms one timer per quiet window, not one per scroll tick', () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    // Nine ticks at 16ms: pokes at 0..128ms, clock at 144ms after the loop.
    for (let tick = 0; tick < 9; tick += 1) {
      chatScrollActivity.poke();
      jest.advanceTimersByTime(16);
    }

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(chatScrollActivity.isActive()).toBe(true);

    // The window ends 150ms after the last poke: at 278ms, 134ms from now.
    jest.advanceTimersByTime(133);
    expect(chatScrollActivity.isActive()).toBe(true);

    jest.advanceTimersByTime(1);
    expect(chatScrollActivity.isActive()).toBe(false);

    // The first timer fired at 150ms and re-armed once for the remainder.
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  test('subscribers are notified only on transitions', () => {
    const listener = jest.fn();
    const unsubscribe = chatScrollActivity.subscribe(listener);

    chatScrollActivity.poke();
    chatScrollActivity.poke();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(true);

    jest.advanceTimersByTime(150);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(false);

    unsubscribe();
  });

  test('reset clears active state immediately', () => {
    chatScrollActivity.poke();
    expect(chatScrollActivity.isActive()).toBe(true);

    chatScrollActivity.reset();
    expect(chatScrollActivity.isActive()).toBe(false);
  });
});

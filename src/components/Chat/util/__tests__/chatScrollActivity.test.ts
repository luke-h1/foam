import { chatScrollActivity } from '../chatScrollActivity';

describe('chatScrollActivity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    chatScrollActivity.reset();
  });

  afterEach(() => {
    chatScrollActivity.reset();
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

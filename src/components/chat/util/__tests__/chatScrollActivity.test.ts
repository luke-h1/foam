import { chatScrollActivity } from '@app/components/chat/util/chatScrollActivity';

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

  test('a burst of scroll ticks settles 150ms after the last tick', () => {
    for (let tick = 0; tick < 9; tick += 1) {
      chatScrollActivity.poke();
      jest.advanceTimersByTime(16);
    }

    expect(chatScrollActivity.isActive()).toBe(true);

    jest.advanceTimersByTime(133);
    expect(chatScrollActivity.isActive()).toBe(true);

    jest.advanceTimersByTime(1);
    expect(chatScrollActivity.isActive()).toBe(false);
  });

  test('a one-second fling at 120Hz arms one timer per settle window, not one per tick', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    for (let tick = 0; tick < 120; tick += 1) {
      chatScrollActivity.poke();
      jest.advanceTimersByTime(8);
    }

    const timersDuringFling = setTimeoutSpy.mock.calls.length;

    jest.advanceTimersByTime(150);
    setTimeoutSpy.mockRestore();

    expect({
      active: chatScrollActivity.isActive(),
      timersDuringFling,
    }).toEqual({ active: false, timersDuringFling: 7 });
  });

  test('a subscriber hears one true at the first tick and one false after the fling settles', () => {
    const listener = jest.fn();
    const unsubscribe = chatScrollActivity.subscribe(listener);

    for (let tick = 0; tick < 60; tick += 1) {
      chatScrollActivity.poke();
      jest.advanceTimersByTime(16);
    }

    const callsDuringFling = listener.mock.calls.length;

    jest.advanceTimersByTime(150);
    unsubscribe();

    expect({ callsDuringFling, calls: listener.mock.calls }).toEqual({
      callsDuringFling: 1,
      calls: [[true], [false]],
    });
  });

  test('reset during a fling notifies false once and cancels the pending settle', () => {
    const listener = jest.fn();

    chatScrollActivity.poke();
    const unsubscribe = chatScrollActivity.subscribe(listener);

    chatScrollActivity.reset();
    jest.advanceTimersByTime(500);
    unsubscribe();

    expect({
      calls: listener.mock.calls,
      pendingTimers: jest.getTimerCount(),
    }).toEqual({ calls: [[false]], pendingTimers: 0 });
  });

  test('an unsubscribed listener is not notified', () => {
    const listener = jest.fn();
    const unsubscribe = chatScrollActivity.subscribe(listener);

    unsubscribe();
    chatScrollActivity.poke();
    jest.advanceTimersByTime(150);

    expect(listener.mock.calls).toEqual([]);
  });

  test('reset clears active state immediately', () => {
    chatScrollActivity.poke();
    expect(chatScrollActivity.isActive()).toBe(true);

    chatScrollActivity.reset();
    expect(chatScrollActivity.isActive()).toBe(false);
  });
});

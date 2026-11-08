import { withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves with the promise and clears the timer when it settles first', async () => {
    const onTimeout = jest.fn(() => 'fallback');

    await expect(
      withTimeout(Promise.resolve('value'), 1000, onTimeout),
    ).resolves.toBe('value');

    expect(jest.getTimerCount()).toBe(0);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  test('rejects with the promise error and clears the timer', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('boom')), 1000, () => 'fallback'),
    ).rejects.toEqual(new Error('boom'));

    expect(jest.getTimerCount()).toBe(0);
  });

  test('resolves with the onTimeout value when the deadline passes first', async () => {
    const pending = withTimeout(new Promise<string>(() => {}), 1000, () => {
      return 'fallback';
    });

    await jest.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBe('fallback');
  });

  test('rejects when onTimeout throws', async () => {
    const pending = withTimeout(new Promise<string>(() => {}), 1000, () => {
      throw new Error('timed out');
    });

    const assertion = expect(pending).rejects.toEqual(new Error('timed out'));

    await jest.advanceTimersByTimeAsync(1000);

    await assertion;
  });
});

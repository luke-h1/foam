import {
  dismissChangelogAndroid,
  getChangelogAndroidState,
  presentChangelogAndroid,
  subscribeChangelogAndroid,
} from '../changelogAndroidPresenter';

const baseOptions = {
  notes: [
    {
      version: '1.0.0',
      items: [
        {
          type: 'list' as const,
          title: 'Notes',
          rows: [{ title: 'A', description: 'B' }],
        },
      ],
    },
  ],
  version: '1.0.0',
};

describe('changelogAndroidPresenter', () => {
  afterEach(() => {
    dismissChangelogAndroid();
    jest.useRealTimers();
  });

  test('present sets state and resolves true on dismiss', async () => {
    const pending = presentChangelogAndroid(baseOptions);
    expect(getChangelogAndroidState()).toEqual(baseOptions);

    dismissChangelogAndroid();
    await expect(pending).resolves.toBe(true);
    expect(getChangelogAndroidState()).toBeNull();
  });

  test('a concurrent present resolves false without replacing state', async () => {
    const first = presentChangelogAndroid(baseOptions);
    const second = presentChangelogAndroid({
      ...baseOptions,
      version: '2.0.0',
    });

    expect(getChangelogAndroidState()?.version).toBe('1.0.0');
    dismissChangelogAndroid();

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(false);
  });

  test('timeout settles as not presented and clears state', async () => {
    jest.useFakeTimers();
    const pending = presentChangelogAndroid(baseOptions);
    expect(getChangelogAndroidState()).toEqual(baseOptions);

    jest.advanceTimersByTime(120_000);
    await expect(pending).resolves.toBe(false);
    expect(getChangelogAndroidState()).toBeNull();
  });

  test('notifies subscribers when presented and dismissed', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeChangelogAndroid(listener);

    presentChangelogAndroid(baseOptions);
    dismissChangelogAndroid();

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

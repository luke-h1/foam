import {
  createAwaitableOverlayStore,
  createOverlayStore,
} from '../createOverlayStore';

describe('createOverlayStore', () => {
  test('starts empty and reflects present/dismiss', () => {
    const store = createOverlayStore<string>();

    expect(store.getState()).toBeNull();

    store.present('sheet');
    expect(store.getState()).toBe('sheet');

    store.dismiss();
    expect(store.getState()).toBeNull();
  });

  test('notifies subscribers on present and dismiss', () => {
    const store = createOverlayStore<string>();
    const listener = jest.fn();
    store.subscribe(listener);

    store.present('a');
    store.dismiss();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  test('dismiss on an empty store is a no-op and does not notify', () => {
    const store = createOverlayStore<string>();
    const listener = jest.fn();
    store.subscribe(listener);

    store.dismiss();

    expect(listener).not.toHaveBeenCalled();
  });

  test('unsubscribe stops further notifications', () => {
    const store = createOverlayStore<string>();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.present('a');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('createAwaitableOverlayStore', () => {
  test('present returns a promise that resolves when dismissed', async () => {
    const store = createAwaitableOverlayStore<string>();

    const pending = store.present('sheet');
    expect(store.getState()).toBe('sheet');

    store.dismiss();
    await expect(pending).resolves.toBeUndefined();
    expect(store.getState()).toBeNull();
  });

  test('a concurrent present returns the in-flight promise without replacing state', () => {
    const store = createAwaitableOverlayStore<string>();

    const first = store.present('first');
    const second = store.present('second');

    expect(second).toBe(first);
    expect(store.getState()).toBe('first');
  });

  test('a present after dismiss opens a fresh awaitable', async () => {
    const store = createAwaitableOverlayStore<string>();

    const first = store.present('first');
    store.dismiss();
    await first;

    const second = store.present('second');
    expect(second).not.toBe(first);
    expect(store.getState()).toBe('second');

    store.dismiss();
    await expect(second).resolves.toBeUndefined();
  });
});

import { createRowVisibilityStore } from '../rowVisibility';

describe('createRowVisibilityStore', () => {
  test('defaults to visible and reflects setVisible', () => {
    const store = createRowVisibilityStore();
    expect(store.isVisible()).toBe(true);

    store.setVisible(false);
    expect(store.isVisible()).toBe(false);
  });

  test('notifies subscribers only on an actual change', () => {
    const store = createRowVisibilityStore();
    const listener = jest.fn();
    store.subscribe(listener);

    store.setVisible(true);
    expect(listener).not.toHaveBeenCalled();

    store.setVisible(false);
    expect(listener).toHaveBeenCalledWith(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('stops notifying after unsubscribe', () => {
    const store = createRowVisibilityStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setVisible(false);

    expect(listener).not.toHaveBeenCalled();
  });
});

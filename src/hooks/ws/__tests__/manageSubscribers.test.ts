import {
  addSubscriber,
  hasSubscriber,
  hasSubscribers,
  removeSubscriber,
} from '../manage-subscribers';
import type { Subscriber } from '../types';

function createSubscriber(): Subscriber {
  return {
    setLastMessage: jest.fn(),
    setReadyState: jest.fn(),
    optionsRef: { current: {} },
    reconnectCount: { current: 0 },
    reconnect: { current: jest.fn() },
  };
}

describe('hasSubscriber', () => {
  test('reports a registered subscriber', () => {
    const subscriber = createSubscriber();
    addSubscriber('wss://registered.test', subscriber);

    expect(hasSubscriber('wss://registered.test', subscriber)).toBe(true);
  });

  test('reports a removed subscriber as gone', () => {
    const subscriber = createSubscriber();
    addSubscriber('wss://removed.test', subscriber);
    removeSubscriber('wss://removed.test', subscriber);

    expect(hasSubscriber('wss://removed.test', subscriber)).toBe(false);
    expect(hasSubscribers('wss://removed.test')).toBe(false);
  });

  test('does not confuse subscribers across urls', () => {
    const subscriber = createSubscriber();
    addSubscriber('wss://a.test', subscriber);

    expect(hasSubscriber('wss://b.test', subscriber)).toBe(false);
  });

  test('returns false for a url nothing ever subscribed to', () => {
    expect(hasSubscriber('wss://unknown.test', createSubscriber())).toBe(false);
  });
});

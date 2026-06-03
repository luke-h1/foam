import { emptyEmoteData } from '../constants';
import { limitChannelCaches } from '../state';

jest.mock('@legendapp/state/persist', () => ({
  configureObservablePersistence: jest.fn(),
  persistObservable: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    set = jest.fn();
    getString = jest.fn();
    getAllKeys = jest.fn(() => []);
    delete = jest.fn();
  },
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    remove: jest.fn(),
  }),
}));

const makeCache = (lastUpdated: number) => ({
  ...emptyEmoteData,
  lastUpdated,
});

describe('limitChannelCaches', () => {
  test('prunes stale channels without requiring Array.prototype.toSorted', () => {
    const arrayPrototype = Array.prototype as { toSorted?: unknown };
    const nativeToSorted = arrayPrototype.toSorted;
    delete arrayPrototype.toSorted;

    try {
      const result = limitChannelCaches(
        {
          'channel-0': makeCache(0),
          'channel-1': makeCache(1),
          'channel-2': makeCache(2),
          'channel-3': makeCache(3),
          'channel-4': makeCache(4),
          'channel-5': makeCache(5),
          'channel-6': makeCache(6),
          'channel-7': makeCache(7),
          'channel-8': makeCache(8),
          'channel-9': makeCache(9),
          'channel-10': makeCache(10),
          'channel-11': makeCache(11),
          'channel-12': makeCache(12),
          'channel-13': makeCache(13),
          'channel-14': makeCache(14),
          'channel-15': makeCache(15),
          'channel-16': makeCache(16),
          'channel-17': makeCache(17),
          'channel-18': makeCache(18),
          'channel-19': makeCache(19),
          'channel-20': makeCache(20),
          current: makeCache(-1),
        },
        'current',
      );

      expect(Object.keys(result)).toHaveLength(20);
      expect(result.current).toBeDefined();
      expect(result['channel-0']).toBeUndefined();
      expect(result['channel-20']).toBeDefined();
    } finally {
      if (nativeToSorted) {
        arrayPrototype.toSorted = nativeToSorted;
      }
    }
  });
});

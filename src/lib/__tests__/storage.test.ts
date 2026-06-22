import { storageService } from '@app/lib/storage';

jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    createMMKV: () => ({
      set: (key: string, value: string) => {
        store.set(key, value);
      },
      getString: (key: string) => store.get(key),
      remove: (key: string) => {
        store.delete(key);
      },
      getAllKeys: () => [...store.keys()],
    }),
  };
});

beforeEach(() => {
  storageService.clear();
});

describe('storageService round trip', () => {
  it('stores and reads back a value', () => {
    storageService.set('previous_searches', ['kappa']);

    expect(storageService.getString('previous_searches')).toEqual(['kappa']);
  });

  it('returns null for a missing key', () => {
    expect(storageService.getString('previous_searches')).toBeNull();
  });
});

describe('storageService expiry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not store a value whose expiry is already in the past', () => {
    storageService.set('previous_searches', ['kappa'], undefined, {
      expiry: new Date('2025-12-31T00:00:00.000Z'),
    });

    expect(storageService.getString('previous_searches')).toBeNull();
  });

  it('returns the value before expiry and null (removed) after', () => {
    storageService.set('previous_searches', ['kappa'], undefined, {
      expiry: new Date('2026-01-01T00:01:00.000Z'),
    });

    expect(storageService.getString('previous_searches')).toEqual(['kappa']);

    jest.setSystemTime(new Date('2026-01-01T00:02:00.000Z'));
    expect(storageService.getString('previous_searches')).toBeNull();

    // Reading after expiry removes the key, so a later valid window stays empty.
    jest.setSystemTime(new Date('2026-01-01T00:00:30.000Z'));
    expect(storageService.getString('previous_searches')).toBeNull();
  });
});

describe('storageService namespaces', () => {
  it('isolates and clears a namespace without touching other keys', () => {
    storageService.set('sevenTvUserId_1', 'a', 'seven_tv_cache');
    storageService.set('previous_searches', ['kappa']);

    expect(storageService.getString('sevenTvUserId_1', 'seven_tv_cache')).toBe(
      'a',
    );

    storageService.clearNamespace('seven_tv_cache');

    expect(
      storageService.getString('sevenTvUserId_1', 'seven_tv_cache'),
    ).toBeNull();
    expect(storageService.getString('previous_searches')).toEqual(['kappa']);
  });

  it('clearImageCache only removes image_cache keys', () => {
    storageService.set('appStoreLink_x', 'cached', 'image_cache');
    storageService.set('sevenTvUserId_1', 'a', 'seven_tv_cache');

    storageService.clearImageCache();

    expect(
      storageService.getString('appStoreLink_x', 'image_cache'),
    ).toBeNull();
    expect(storageService.getString('sevenTvUserId_1', 'seven_tv_cache')).toBe(
      'a',
    );
  });
});

import {
  storage,
  type StorageChangeEvent,
  storageService,
} from '@app/lib/storage';

beforeEach(() => {
  storageService.clear();
});

describe('storageService round trip', () => {
  test('stores and reads back a value', () => {
    storageService.set('previous_searches', ['kappa']);

    expect(storageService.getString('previous_searches')).toEqual(['kappa']);
  });

  test('returns null for a missing key', () => {
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

  test('does not store a value whose expiry is already in the past', () => {
    storageService.set('previous_searches', ['kappa'], undefined, {
      expiry: new Date('2025-12-31T00:00:00.000Z'),
    });

    expect(storageService.getString('previous_searches')).toBeNull();
  });

  test('returns the value before expiry and null (removed) after', () => {
    storageService.set('previous_searches', ['kappa'], undefined, {
      expiry: new Date('2026-01-01T00:01:00.000Z'),
    });

    expect(storageService.getString('previous_searches')).toEqual(['kappa']);

    jest.setSystemTime(new Date('2026-01-01T00:02:00.000Z'));
    expect(storageService.getString('previous_searches')).toBeNull();

    jest.setSystemTime(new Date('2026-01-01T00:00:30.000Z'));

    expect(storageService.getString('previous_searches')).toBeNull();
  });

  test('clearExpired sweeps expired keys and keeps unexpired ones', () => {
    storageService.set('previous_searches', ['kappa'], undefined, {
      expiry: new Date('2026-01-01T00:01:00.000Z'),
    });

    storageService.set('sevenTvUserId_1', 'a', 'seven_tv_cache');

    jest.setSystemTime(new Date('2026-01-01T00:02:00.000Z'));
    storageService.clearExpired();

    expect(storageService.getAllKeys()).toEqual([
      'FOAM_V1_seven_tv_cache_sevenTvUserId_1',
    ]);
  });
});

describe('storageService namespaces', () => {
  test('isolates and clears a namespace without touching other keys', () => {
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
});

describe('storageService corrupt values', () => {
  test.each([
    ['invalid JSON', '{not json'],
    ['null', 'null'],
    ['an array', '[1,2]'],
    ['a primitive', '42'],
    ['an object with no value', '{"expiry":"2026-01-01T00:00:00.000Z"}'],
  ])('returns null when the stored value is %s', (_label, raw) => {
    storage.set('FOAM_V1_previous_searches', raw);

    expect(storageService.getString('previous_searches')).toBeNull();
  });

  test('clearExpired skips a corrupt value and keeps it', () => {
    storage.set('FOAM_V1_previous_searches', '{not json');

    storageService.clearExpired();

    expect(storageService.getAllKeys()).toEqual(['FOAM_V1_previous_searches']);
  });
});

describe('storageService change events', () => {
  test('emits a typed event for each kind of change', () => {
    const events: StorageChangeEvent[] = [];
    const listener = (event: StorageChangeEvent) => events.push(event);

    storageService.events.on('storageChange', listener);

    storageService.set('previous_searches', ['kappa']);
    storageService.set('sevenTvUserId_1', 'a', 'seven_tv_cache');
    storageService.remove('previous_searches');
    storageService.delete('sevenTvUserId_1', 'seven_tv_cache');
    storageService.clearNamespace('seven_tv_cache');
    storageService.clear();

    storageService.events.off('storageChange', listener);

    expect(events).toEqual<StorageChangeEvent[]>([
      { kind: 'set', key: 'previous_searches', namespace: undefined },
      { kind: 'set', key: 'sevenTvUserId_1', namespace: 'seven_tv_cache' },
      { kind: 'remove', key: 'previous_searches', namespace: undefined },
      { kind: 'remove', key: 'sevenTvUserId_1', namespace: 'seven_tv_cache' },
      { kind: 'clearNamespace', namespace: 'seven_tv_cache' },
      { kind: 'clearAll' },
    ]);
  });
});

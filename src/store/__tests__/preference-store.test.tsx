import { act, renderHook } from '@testing-library/react-native';

import { PREFERENCES_PERSISTENCE_KEY } from '@app/lib/observablePersistence';

import {
  getPreferences,
  initialPreferences,
  migratePreferencesPayload,
  type Preferences,
  replacePreferences,
  toSyncedPreferences,
  updatePreferences,
  usePreference,
  usePreferences,
} from '../preference-store';

jest.unmock('@legendapp/state/persist');

const NOW = 1_700_000_000_000;

const PERSIST_WRITE_DELAY_MS = 250;

async function flushPersistWrites() {
  await jest.advanceTimersByTimeAsync(0);
  await jest.advanceTimersByTimeAsync(PERSIST_WRITE_DELAY_MS);
}

const basePreferences: Preferences = { ...initialPreferences, updatedAt: 1 };

interface PreferenceStoreModule {
  getPreferences: typeof getPreferences;
}

interface MMKVModule {
  createMMKV: (options: { id: string }) => {
    getString: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
  };
}

function readPersistedPreferences(mmkv: MMKVModule): Preferences | null {
  const raw = mmkv
    .createMMKV({ id: 'obsPersist' })
    .getString(PREFERENCES_PERSISTENCE_KEY);

  return raw === undefined ? null : JSON.parse(raw);
}

function startAppWithPersistedPreferences(persisted: string) {
  let store: PreferenceStoreModule | undefined;
  let mmkv: MMKVModule | undefined;

  jest.isolateModules(() => {
    mmkv = require('react-native-mmkv');

    mmkv
      ?.createMMKV({ id: 'obsPersist' })
      .set(PREFERENCES_PERSISTENCE_KEY, persisted);

    store = require('../preference-store');
  });

  if (!store || !mmkv) {
    throw new Error('preference store did not load');
  }

  return { store, mmkv };
}

describe('preference store', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    replacePreferences({ ...basePreferences });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('update writes the new value and the update time to the store and MMKV', async () => {
    const { result } = renderHook(() => usePreference('chatTimestamps'));

    act(() => {
      updatePreferences({ chatTimestamps: true });
    });

    const expected: Preferences = {
      ...basePreferences,
      chatTimestamps: true,
      updatedAt: NOW,
    };

    expect(getPreferences()).toEqual<Preferences>(expected);

    expect(result.current).toBe(true);

    await act(flushPersistWrites);

    expect(readPersistedPreferences(require('react-native-mmkv'))).toEqual<
      Partial<Preferences>
    >(expected);
  });

  test.each<[string, Partial<Preferences>, Record<string, string | number>]>([
    [
      "'text' stream list layout to 'compact'",
      { streamListLayout: 'compact' },
      { streamListLayout: 'text' },
    ],
    [
      "'auto' paint renderer to 'native'",
      { sevenTvPaintRenderer: 'native' },
      { sevenTvPaintRenderer: 'auto' },
    ],
    ['chat delay 0 to auto', { chatDelay: 'auto' }, { chatDelay: 0 }],
  ])('migrates a persisted %s', async (_name, migrated, legacy) => {
    const persisted = { ...basePreferences, ...legacy };

    const { store, mmkv } = startAppWithPersistedPreferences(
      JSON.stringify(persisted),
    );

    const expected: Preferences = { ...basePreferences, ...migrated };

    expect(store.getPreferences()).toEqual<Preferences>(expected);

    await flushPersistWrites();

    expect(readPersistedPreferences(mmkv)).toEqual<Preferences>(expected);
  });

  test('keeps current persisted values as they are', () => {
    const persisted: Preferences = {
      ...basePreferences,
      streamListLayout: 'media',
      sevenTvPaintRenderer: 'skia',
      chatDelay: 'off',
    };

    const { store } = startAppWithPersistedPreferences(
      JSON.stringify(persisted),
    );

    expect(store.getPreferences()).toEqual<Preferences>(persisted);
  });

  test('a write to device-local keys alone keeps the update time', () => {
    updatePreferences({ landscapeChatWidth: 320, disableChat: true });

    expect(getPreferences()).toEqual<Preferences>({
      ...basePreferences,
      landscapeChatWidth: 320,
      disableChat: true,
    });
  });

  test('drops removed preferences from a persisted blob', () => {
    const persisted = {
      ...basePreferences,
      theme: 'foam-dark',
      useUIKitForWebView: true,
    };

    const { store } = startAppWithPersistedPreferences(
      JSON.stringify(persisted),
    );

    expect(store.getPreferences()).toEqual<Preferences>(basePreferences);
  });

  test('a fresh install starts with no local edits', () => {
    expect(initialPreferences.updatedAt).toBe(0);
  });
});

describe('usePreferences', () => {
  const KEYS = ['disableChat', 'chatTimestamps'] as const;

  beforeEach(() => {
    replacePreferences({
      ...basePreferences,
      disableChat: false,
      chatTimestamps: false,
    });
  });

  test('returns only the asked keys and follows their updates', () => {
    const { result } = renderHook(() => usePreferences(KEYS));

    expect(result.current).toEqual<Pick<Preferences, (typeof KEYS)[number]>>({
      disableChat: false,
      chatTimestamps: false,
    });

    act(() => {
      updatePreferences({ chatTimestamps: true });
    });

    expect(result.current).toEqual<Pick<Preferences, (typeof KEYS)[number]>>({
      disableChat: false,
      chatTimestamps: true,
    });
  });
});

describe('migratePreferencesPayload', () => {
  test('fills keys the blob is missing from the defaults', () => {
    const { showChatGifs: _omitted, ...legacy } = basePreferences;

    expect(migratePreferencesPayload(legacy)).toEqual<Preferences>(
      basePreferences,
    );
  });
});

describe('toSyncedPreferences', () => {
  test('leaves out every device-local key', () => {
    const syncedKeys: string[] = Object.keys(
      toSyncedPreferences(initialPreferences),
    );

    expect(
      Object.keys(initialPreferences)
        .filter(key => !syncedKeys.includes(key))
        .sort(),
    ).toEqual([
      'chatDebugTools',
      'disableChat',
      'disableStream',
      'landscapeChatWidth',
      'sevenTvPaintRenderer',
    ]);
  });
});

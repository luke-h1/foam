import { storageService } from '@app/lib/storage';
import { storage } from '@app/lib/storageAdapter.web';

jest.mock('@app/lib/storageAdapter', () =>
  jest.requireActual('@app/lib/storageAdapter.web'),
);

class MemoryStorage {
  private readonly items = new Map<string, string>();

  get length() {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

class ThrowingStorage extends MemoryStorage {
  override get length(): number {
    throw new Error('SecurityError');
  }

  override getItem(): string | null {
    throw new Error('SecurityError');
  }

  override setItem() {
    throw new Error('QuotaExceededError');
  }

  override removeItem() {
    throw new Error('SecurityError');
  }

  override key(): string | null {
    throw new Error('SecurityError');
  }
}

function installLocalStorage(value: MemoryStorage | undefined) {
  Object.defineProperty(globalThis, 'localStorage', {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  installLocalStorage(undefined);
});

describe('web storage adapter', () => {
  beforeEach(() => {
    installLocalStorage(new MemoryStorage());
  });

  test('stores, lists and removes keys', () => {
    storage.set('a', '1');
    storage.set('b', '2');

    expect(storage.getString('a')).toBe('1');

    expect(storage.getAllKeys()).toEqual(['a', 'b']);

    storage.remove('a');

    expect(storage.getString('a')).toBeUndefined();

    expect(storage.getAllKeys()).toEqual(['b']);
  });

  test('runs storageService over localStorage', () => {
    storageService.set('previous_searches', ['kappa']);
    storageService.set('sevenTvUserId_1', 'a', 'seven_tv_cache');

    expect(storageService.getString('previous_searches')).toEqual(['kappa']);

    expect(storageService.getAllKeys('seven_tv_cache')).toEqual([
      'FOAM_V1_seven_tv_cache_sevenTvUserId_1',
    ]);

    storageService.clear();

    expect(storageService.getAllKeys()).toEqual([]);
  });

  test('returns null through storageService for a corrupt value', () => {
    storage.set('FOAM_V1_previous_searches', '{not json');

    expect(storageService.getString('previous_searches')).toBeNull();
  });
});

describe('web storage adapter without usable localStorage', () => {
  test('does nothing when localStorage is missing', () => {
    installLocalStorage(undefined);

    storage.set('a', '1');
    storage.remove('a');

    expect(storage.getString('a')).toBeUndefined();

    expect(storage.getAllKeys()).toEqual([]);
  });

  test('does not throw when localStorage throws', () => {
    installLocalStorage(new ThrowingStorage());

    storage.set('a', '1');
    storage.remove('a');

    expect(storage.getString('a')).toBeUndefined();

    expect(storage.getAllKeys()).toEqual([]);

    expect(storageService.getString('previous_searches')).toBeNull();
  });
});

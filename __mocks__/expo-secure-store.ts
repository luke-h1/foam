/**
 * In-memory fake of expo-secure-store, like the root react-native-mmkv mock.
 * `test/setupTests.ts` clears it before each test. Tests that need to gate or
 * fail a read wrap the export with `jest.spyOn`.
 */
const store = new Map<string, string>();

export function getItemAsync(key: string): Promise<string | null> {
  return Promise.resolve(store.get(key) ?? null);
}

export function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
  return Promise.resolve();
}

export function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
  return Promise.resolve();
}

export function __resetSecureStore() {
  store.clear();
}

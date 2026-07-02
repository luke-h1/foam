const memoryStore = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  const storage = getLocalStorage();
  return storage?.getItem(key) ?? memoryStore.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStore.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  const storage = getLocalStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }

  memoryStore.delete(key);
}

export type StorageSetterOptions = {
  expiry?: Date;
};

export type StorageItem<T = unknown> = {
  expiry?: string;
  value: T;
};

const NAMESPACE = "CHAT_POC";

const namespaceKey = (key: string) => `${NAMESPACE}_${key}`;

const storageService = {
  get<T>(key: string): Promise<T | null> {
    return Promise.resolve().then(() => this.getSync(key));
  },
  getSync<T>(key: string): T | null {
    const item = localStorage.getItem(namespaceKey(key));

    if (!item) {
      return null;
    }

    const { value, expiry } = JSON.parse(item) as StorageItem<T>;

    if (expiry && new Date() >= new Date(expiry)) {
      this.removeSync(key);
      return null;
    }

    return value;
  },
  set(
    key: string,
    value: unknown,
    options: StorageSetterOptions = {}
  ): Promise<void> {
    return Promise.resolve().then(() => {
      this.setSync(key, value, options);
    });
  },
  setSync(
    key: string,
    value: unknown,
    options: StorageSetterOptions = {}
  ): void {
    const { expiry } = options;

    let item: StorageItem = { value };

    if (expiry) {
      // Don't bother setting in storage
      // as it would already be expired.
      if (expiry <= new Date()) {
        return;
      }

      item = { value, expiry: expiry.toISOString() };
    }

    localStorage.setItem(namespaceKey(key), JSON.stringify(item));
  },
  remove(key: string): Promise<void> {
    return Promise.resolve().then(() => this.removeSync(key));
  },
  removeSync(key: string): void {
    localStorage.removeItem(namespaceKey(key));
  },
  clear(): Promise<void> {
    return Promise.resolve().then(this.clearSync);
  },
  clearSync(): void {
    localStorage.clear();
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    // Clear local storage of any existing
    // entries that have expired on startup.
    Promise.resolve().then(() => {
      Object.entries(localStorage).forEach(([key, value]) => {
        if (!key.startsWith(NAMESPACE)) {
          return;
        }

        const { expiry } = JSON.parse(value) as StorageItem;

        if (expiry && new Date() >= new Date(expiry)) {
          storageService.remove(key);
        }
      });
    });
  });
}

export default storageService;

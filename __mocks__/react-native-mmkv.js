const stores = new Map();
const listeners = new Map();

function getStore(id) {
  if (!stores.has(id)) {
    stores.set(id, new Map());
  }

  return stores.get(id);
}

function getListeners(id) {
  if (!listeners.has(id)) {
    listeners.set(id, new Set());
  }

  return listeners.get(id);
}

function notifyListeners(id, key) {
  getListeners(id).forEach(listener => listener(key));
}

function createMMKVInstance(options = {}) {
  const id = options.id ?? 'default';
  const storage = getStore(id);

  return {
    id,
    isReadOnly: false,
    name: 'MMKV',

    get size() {
      return storage.size;
    },

    addOnValueChangedListener(listener) {
      const valueListeners = getListeners(id);
      valueListeners.add(listener);

      return {
        remove: () => valueListeners.delete(listener),
      };
    },

    clearAll() {
      const keys = Array.from(storage.keys());
      storage.clear();
      keys.forEach(key => notifyListeners(id, key));
    },

    contains(key) {
      return storage.has(key);
    },

    delete(key) {
      return this.remove(key);
    },

    dispose() {},

    equals(other) {
      return other === this;
    },

    getAllKeys() {
      return Array.from(storage.keys());
    },

    getBoolean(key) {
      const value = storage.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },

    getBuffer(key) {
      const value = storage.get(key);
      return value instanceof ArrayBuffer ? value : undefined;
    },

    getNumber(key) {
      const value = storage.get(key);
      return typeof value === 'number' ? value : undefined;
    },

    getString(key) {
      const value = storage.get(key);
      return typeof value === 'string' ? value : undefined;
    },

    importAllFrom(other) {
      let imported = 0;

      other.getAllKeys().forEach(key => {
        const value = other.getBuffer(key);

        if (value != null) {
          storage.set(key, value);
          imported += 1;
        }
      });

      return imported;
    },

    recrypt() {},

    remove(key) {
      const deleted = storage.delete(key);

      if (deleted) {
        notifyListeners(id, key);
      }

      return deleted;
    },

    set(key, value) {
      if (key === '') {
        throw new Error('Cannot set a value for an empty key!');
      }

      storage.set(key, value);
      notifyListeners(id, key);
    },

    trim() {},
  };
}

class MMKV {
  constructor(options) {
    return createMMKVInstance(options);
  }
}

module.exports = {
  MMKV,
  createMMKV: createMMKVInstance,
  deleteMMKV: jest.fn(() => true),
  existsMMKV: jest.fn(() => true),
  __resetMMKV: () => {
    stores.clear();
    listeners.clear();
  },
};

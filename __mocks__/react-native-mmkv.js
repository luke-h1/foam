
const storage = new Map();

class MMKV {
  constructor(_options) {
    this.id = _options?.id ?? 'default';
  }

  getString(key) {
    return storage.get(key) ?? undefined;
  }

  set(key, value) {
    storage.set(key, value);
  }

  delete(key) {
    storage.delete(key);
  }
}

module.exports = {
  MMKV,
};

export interface StorageAdapter {
  getString(key: string): string | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | boolean): void;
  remove(key: string): void;
  clearAll(): void;
  getAllKeys(): string[];
}

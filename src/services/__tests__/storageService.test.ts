import AsyncStorage from '@react-native-async-storage/async-storage';
import { AllowedKey, StorageItem, storageService } from '../storageService';

jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = jest.mocked(AsyncStorage);

describe('StorageService', () => {
  test('returns item from storage', async () => {
    const value: StorageItem = { value: true };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(value));

    const result = await storageService.get<boolean>('ReactQueryDebug');
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
      'FOAM_V1_ReactQueryDebug',
    );
    expect(result).toEqual(true);
  });

  test('returns null if item is expired', async () => {
    const key: AllowedKey = 'ReactQueryDebug';
    const value: StorageItem = {
      value: true,
      expiry: new Date(Date.now() - 1000).toISOString(),
    };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(value));

    const result = await storageService.get<boolean>(key);

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
      'FOAM_V1_ReactQueryDebug',
    );
    expect(result).toEqual(null);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      'FOAM_V1_ReactQueryDebug',
    );
  });

  test('sets an item in storage', async () => {
    const key: AllowedKey = 'ReactQueryDebug';
    const value = true;

    await storageService.set(key, value);

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'FOAM_V1_ReactQueryDebug',
      JSON.stringify({ value }),
    );
  });

  test('removes item from storage', async () => {
    const key: AllowedKey = 'ReactQueryDebug';

    await storageService.remove(key);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      'FOAM_V1_ReactQueryDebug',
    );
  });

  test('clears all namespaced items from storage', async () => {
    const keys = ['FOAM_V1_ReactQueryDebug', 'FOAM_V1_AnotherKey', 'OTHER_KEY'];
    mockAsyncStorage.getAllKeys.mockResolvedValueOnce(keys);

    await storageService.clear();

    expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
      'FOAM_V1_ReactQueryDebug',
      'FOAM_V1_AnotherKey',
    ]);
    expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalledWith([
      'OTHER_KEY',
    ]);
  });

  test('clears expired items from storage', async () => {
    const keys = ['FOAM_V1_ReactQueryDebug'];
    const value = {
      value: true,
      expiry: new Date(Date.now() - 1000).toISOString(),
    };
    mockAsyncStorage.getAllKeys.mockResolvedValueOnce(keys);
    mockAsyncStorage.multiGet.mockResolvedValueOnce([
      [keys[0] as string, JSON.stringify(value)],
    ]);

    await storageService.clearExpired();

    expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
    expect(mockAsyncStorage.multiGet).toHaveBeenCalledWith(keys);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      'FOAM_V1_ReactQueryDebug',
    );
  });
});

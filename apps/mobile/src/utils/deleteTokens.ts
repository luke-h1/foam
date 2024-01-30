import { StorageKeys } from '@app/context/AuthContext';
import * as SecureStore from 'expo-secure-store';

export const deleteTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(StorageKeys.anonToken),
    SecureStore.deleteItemAsync(StorageKeys.authToken),
  ]);
};

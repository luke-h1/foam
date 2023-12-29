import * as SecureStore from 'expo-secure-store';
import { StorageKeys } from '../context/AuthContext';

export const deleteTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(StorageKeys.anonToken),
    SecureStore.deleteItemAsync(StorageKeys.authToken),
  ]);
};

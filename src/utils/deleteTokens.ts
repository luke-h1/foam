import { storageKeys } from '@app/context/AuthContext';
import * as SecureStore from 'expo-secure-store';

export const deleteTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(storageKeys.anon),
    SecureStore.deleteItemAsync(storageKeys.user),
  ]);
};

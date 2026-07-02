import { storageKeys } from '@app/context/AuthContext';

import * as SecureStore from './secureStore';

export const deleteTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(storageKeys.anon),
    SecureStore.deleteItemAsync(storageKeys.user),
  ]);
};

import { storageKeys } from '@app/context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { deleteTokens } from '../deleteTokens';

describe('deleteTokens', () => {
  test('should delete anonToken and authToken', async () => {
    const mockDeleteItemAsync = jest
      .spyOn(SecureStore, 'deleteItemAsync')
      .mockImplementation(() => Promise.resolve());

    await deleteTokens();

    expect(mockDeleteItemAsync).toHaveBeenCalledWith(storageKeys.anon);
    expect(mockDeleteItemAsync).toHaveBeenCalledWith(storageKeys.user);

    mockDeleteItemAsync.mockRestore();
  });
});

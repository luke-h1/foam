import * as SecureStore from 'expo-secure-store';
import { StorageKeys } from '../../context/AuthContext';
import { deleteTokens } from '../deleteTokens';

describe('deleteTokens', () => {
  it('should delete anonToken and authToken', async () => {
    const mockDeleteItemAsync = jest
      .spyOn(SecureStore, 'deleteItemAsync')
      .mockImplementation(() => Promise.resolve());

    await deleteTokens();

    expect(mockDeleteItemAsync).toHaveBeenCalledWith(StorageKeys.anonToken);
    expect(mockDeleteItemAsync).toHaveBeenCalledWith(StorageKeys.authToken);

    mockDeleteItemAsync.mockRestore();
  });
});

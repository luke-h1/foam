import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'storageService',
  compareBeforeSet: true,
});

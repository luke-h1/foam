import { createMMKV } from 'react-native-mmkv';

export const storageMMKV = createMMKV({
  id: 'storageService',
  compareBeforeSet: true,
  mode: 'multi-process',
});

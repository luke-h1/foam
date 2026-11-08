import { Platform } from 'react-native';

export function isLowFlushBudgetPlatform(): boolean {
  return Platform.OS === 'android';
}

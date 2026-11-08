import { Platform } from 'react-native';

/**
 * Android pays more per Fabric commit under animated-emote floods (issue
 * #594), so the chat commits less often and in smaller batches there.
 */
export function isLowFlushBudgetPlatform(): boolean {
  return Platform.OS === 'android';
}

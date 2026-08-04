import { Platform } from 'react-native';

export const maxLiveCommitPerFlush = (
  isAtBottom: boolean,
): number | undefined => {
  if (!isAtBottom) {
    return undefined;
  }

  return Platform.OS === 'android' ? 4 : 8;
};

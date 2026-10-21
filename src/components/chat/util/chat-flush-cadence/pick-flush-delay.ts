import { Platform } from 'react-native';

/**
 * Each flush commits a new Fabric shadow tree (issue #594). Android pays more
 * per commit under animated-emote floods, so it uses 150ms; iOS stays at 100ms
 * which still reads as live and cut app CPU by ~40% on an 18k-viewer chat.
 */
const IOS_LIVE_BUFFER_FLUSH_INTERVAL_MS = 100;
const ANDROID_LIVE_BUFFER_FLUSH_INTERVAL_MS = 150;

const BACKLOG_BUFFER_FLUSH_INTERVAL_MS = 250;
const RAID_BUFFER_FLUSH_INTERVAL_MS = 180;

export const pickFlushDelay = ({
  isAtBottom,
  raidMode,
  scrollingToBottom,
}: {
  isAtBottom: boolean;
  raidMode: boolean;
  scrollingToBottom: boolean;
}): number => {
  if (!isAtBottom && !scrollingToBottom) {
    return BACKLOG_BUFFER_FLUSH_INTERVAL_MS;
  }

  if (raidMode) {
    return RAID_BUFFER_FLUSH_INTERVAL_MS;
  }

  if (Platform.OS === 'android') {
    return ANDROID_LIVE_BUFFER_FLUSH_INTERVAL_MS;
  }

  return IOS_LIVE_BUFFER_FLUSH_INTERVAL_MS;
};

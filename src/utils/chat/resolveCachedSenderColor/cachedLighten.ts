import { Appearance } from 'react-native';

import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { readableChatColor } from '@app/utils/color/lightenColor';

/**
 * Runs on the imperative ingest path, so the scheme comes from Appearance
 * rather than a hook. Cache keys are scheme-prefixed so a mid-session flip
 * never serves colors normalized for the other background.
 */
export function cachedLighten(color: string): string {
  const scheme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  const key = `${scheme}:${color}`;

  const cached = getSessionCacheString('lightenedColors', key);
  if (cached !== undefined) {
    return cached;
  }

  const readable = readableChatColor(color, scheme);
  setSessionCacheString('lightenedColors', key, readable);
  return readable;
}

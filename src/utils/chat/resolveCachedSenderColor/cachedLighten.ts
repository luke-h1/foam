import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { lightenColor } from '@app/utils/color/lightenColor';

export function cachedLighten(color: string): string {
  const cached = getSessionCacheString('lightenedColors', color);
  if (cached !== undefined) {
    return cached;
  }

  const lightened = lightenColor(color);
  setSessionCacheString('lightenedColors', color, lightened);
  return lightened;
}

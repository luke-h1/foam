import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chat-color-caches';
import { lightenColor } from '@app/utils/color/lighten-color';

export function cachedLighten(color: string): string {
  const cached = getSessionCacheString('lightenedColors', color);

  if (cached !== undefined) {
    return cached;
  }

  const lightened = lightenColor(color);
  setSessionCacheString('lightenedColors', color, lightened);
  return lightened;
}

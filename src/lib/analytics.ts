import { customEvent } from 'vexo-analytics';

import { preferences$ } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const vexoApiKey = process.env.EXPO_PUBLIC_VEXO_API_KEY;

export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {},
): void {
  if (!vexoApiKey || !preferences$.analyticsEnabled.peek()) {
    return;
  }

  try {
    customEvent(name, properties);
  } catch (error) {
    logger.main.warn('Failed to record Vexo event', error);
  }
}

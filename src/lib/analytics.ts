import { customEvent } from 'vexo-analytics';

import { preferences$ } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const vexoApiKey = process.env.EXPO_PUBLIC_VEXO_API_KEY;

/**
 * Records a custom Vexo analytics event. No-ops when the user has opted out via
 * the `analyticsEnabled` preference or when no API key is configured, so call
 * sites can fire events unconditionally without guarding.
 */
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

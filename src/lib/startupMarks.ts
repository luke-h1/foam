import performance from 'react-native-performance';

import { recordMeasurement } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';
import FullyDrawn from '@modules/fully-drawn/src/FullyDrawnModule';

export type StartupMark =
  'root_layout_render' | 'index_route_render' | 'first_screen_interactive';

const recorded = new Set<StartupMark>();

/**
 * One-shot per process. The log line feeds the dev cold-start harness; the
 * Sentry measurement is what release builds report.
 */
export function markStartup(name: StartupMark): void {
  if (recorded.has(name)) {
    return;
  }
  recorded.add(name);
  performance.mark(`startup.${name}`);
  if (name === 'first_screen_interactive') {
    FullyDrawn.report();
  }
  // performance.now() counts from device boot, not process start.
  const launchStart = performance.getEntriesByName('nativeLaunchStart')[0];
  if (!launchStart) {
    return;
  }
  const msSinceLaunch = Math.round(performance.now() - launchStart.startTime);
  recordMeasurement(`startup.${name}`, msSinceLaunch);
  logger.performance.info(`startup.${name}`, {
    ms_since_launch: msSinceLaunch,
  });
}

/**
 * FlashList `onLoad` on the first screen's list, so the mark lands once items
 * are drawn.
 */
export function markFirstScreenInteractive(): void {
  markStartup('first_screen_interactive');
}

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
  // performance.now() counts from device boot, not process start.
  const launchStart =
    performance.getEntriesByName('nativeLaunchStart')[0]?.startTime ?? 0;
  const msSinceLaunch = Math.round(performance.now() - launchStart);
  recordMeasurement(`startup.${name}`, msSinceLaunch);
  logger.performance.info(`startup.${name}`, {
    ms_since_launch: msSinceLaunch,
  });
  if (name === 'first_screen_interactive') {
    FullyDrawn.report();
  }
}

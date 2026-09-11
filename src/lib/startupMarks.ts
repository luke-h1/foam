import performance from 'react-native-performance';

import { logger } from '@app/utils/logger';
import FullyDrawn from '@modules/fully-drawn/src/FullyDrawnModule';

export type StartupMark =
  'root_layout_render' | 'index_route_render' | 'first_screen_interactive';

const recorded = new Set<StartupMark>();

/**
 * Splits `runApplication -> first frame -> usable screen`. One-shot per
 * process; the log line is what `scripts/perf` reads from the console.
 */
export function markStartup(name: StartupMark): void {
  if (recorded.has(name)) {
    return;
  }
  recorded.add(name);
  performance.mark(`startup.${name}`);
  logger.performance.info(`startup.${name}`, {
    ms_since_launch: Math.round(performance.now()),
  });
  if (name === 'first_screen_interactive') {
    FullyDrawn.report();
  }
}

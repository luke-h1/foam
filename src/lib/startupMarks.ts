import { recordMeasurement } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';
import FullyDrawn from '@modules/fully-drawn/src/FullyDrawnModule';

export type StartupMark =
  | 'root_layout_render'
  | 'index_route_render'
  | 'first_screen_interactive';

const recorded = new Set<StartupMark>();

type PerformanceWithStartup = Performance & {
  rnStartupTiming?: { startTime: number | null };
};

function hasStartupTiming(clock: Performance): clock is PerformanceWithStartup {
  return 'rnStartupTiming' in clock;
}

export function markStartup(name: StartupMark): void {
  if (recorded.has(name)) {
    return;
  }

  recorded.add(name);
  performance.mark(`startup.${name}`);

  if (name === 'first_screen_interactive') {
    FullyDrawn.report();
  }

  if (!hasStartupTiming(performance)) {
    return;
  }

  const launchStart = performance.rnStartupTiming?.startTime;

  if (launchStart == null) {
    return;
  }

  const msSinceLaunch = Math.round(performance.now() - launchStart);
  recordMeasurement(`startup.${name}`, msSinceLaunch);

  logger.performance.info(`startup.${name}`, {
    ms_since_launch: msSinceLaunch,
  });
}

export function markFirstScreenInteractive(): void {
  markStartup('first_screen_interactive');
}

import { logger } from '../logger';

const performanceLogs: Record<string, string> = {};

export async function logPerformance(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  measurable: Function,
  additionalInfo: string[],
) {
  const startTime = performance.now();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await measurable();
  const totalTime = performance.now() - startTime;
  logger.performance.debug(
    `⏳ ${additionalInfo.join(', ')} -- time: ${totalTime.toFixed(2)} ms`,
  );
  performanceLogs[additionalInfo.join(', ')] = totalTime.toFixed(2);
}

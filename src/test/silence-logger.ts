import { logger } from '@app/utils/logger';

/**
 * Mutes every logger method for the test file. Call it at module scope. A test
 * that asserts on a log call can still read the spy: `jest.spyOn` returns the
 * spy that this helper made.
 */
export function silenceLogger(): void {
  Object.values(logger).forEach(methods => {
    jest.spyOn(methods, 'debug').mockImplementation(() => {});
    jest.spyOn(methods, 'info').mockImplementation(() => {});
    jest.spyOn(methods, 'warn').mockImplementation(() => {});
    jest.spyOn(methods, 'error').mockImplementation(() => {});
  });
}

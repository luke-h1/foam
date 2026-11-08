import { logger } from '@app/utils/logger';

export function silenceLogger(): void {
  Object.values(logger).forEach(methods => {
    jest.spyOn(methods, 'debug').mockImplementation(() => {});
    jest.spyOn(methods, 'info').mockImplementation(() => {});
    jest.spyOn(methods, 'warn').mockImplementation(() => {});
    jest.spyOn(methods, 'error').mockImplementation(() => {});
  });
}

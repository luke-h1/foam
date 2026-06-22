import { useEffect } from 'react';

import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { logger } from '@app/utils/logger';

import {
  type ExperimentName,
  type ExperimentVariant,
  resolveExperimentVariant,
} from './experiments';

const loggedExposures = new Set<string>();

function logExposure(name: string, variant: string): void {
  const key = `${name}:${variant}`;
  if (loggedExposures.has(key)) {
    return;
  }
  loggedExposures.add(key);
  logger.main.info('experiment_exposure', { experiment: name, variant });
}

/**
 * Reads the Firebase-assigned variant for an experiment and logs a one-time
 * exposure so the assignment can be measured against analytics.
 */
export function useExperiment<N extends ExperimentName>(
  name: N,
): ExperimentVariant<N> {
  const { config } = useRemoteConfig();
  const variant = resolveExperimentVariant(name, config.experiments.value);

  useEffect(() => {
    logExposure(name, variant);
  }, [name, variant]);

  return variant;
}

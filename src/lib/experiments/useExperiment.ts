import { useEffect } from 'react';

import { logAnalyticsEvent } from '@app/hooks/firebase/analytics';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';

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
  void logAnalyticsEvent('experiment_exposure', {
    experiment: name,
    variant,
  });
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
  /**
   * Only report exposures for remotely-assigned variants; before the fetch
   * activates, the hook resolves the control default and logging that would
   * put every treatment user in both arms.
   */
  const isRemoteAssignment = config.experiments.source === 'remote';

  useEffect(() => {
    if (!isRemoteAssignment) {
      return;
    }
    logExposure(name, variant);
  }, [isRemoteAssignment, name, variant]);

  return variant;
}

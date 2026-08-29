import type { RemoteConfigSchema } from '@app/hooks/firebase/useRemoteConfig';

interface ExperimentDefinition {
  readonly variants: readonly string[];
  readonly control: string;
}

const EXPERIMENTS = {
  chatComposerLayout: {
    variants: ['control', 'compact'],
    control: 'control',
  },
} as const satisfies Record<string, ExperimentDefinition>;

export type ExperimentName = keyof typeof EXPERIMENTS;

export type ExperimentVariant<N extends ExperimentName> =
  (typeof EXPERIMENTS)[N]['variants'][number];

function isDeclaredVariant<N extends ExperimentName>(
  variants: readonly string[],
  assigned: string,
): assigned is ExperimentVariant<N> {
  return variants.includes(assigned);
}

export function resolveExperimentVariant<N extends ExperimentName>(
  name: N,
  assignments: RemoteConfigSchema['experiments'],
): ExperimentVariant<N> {
  const definition = EXPERIMENTS[name];
  const safeAssignments =
    assignments instanceof Object && !Array.isArray(assignments)
      ? assignments
      : {};
  const assigned = safeAssignments[name];

  return assigned !== undefined &&
    isDeclaredVariant<N>(definition.variants, assigned)
    ? assigned
    : definition.control;
}

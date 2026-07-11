import type { RemoteConfigSchema } from '@app/hooks/firebase/useRemoteConfig';

interface ExperimentDefinition {
  readonly variants: readonly string[];
  readonly control: string;
}

/**
 * Registry of A/B experiments. Each entry maps to a key inside the Remote
 * Config `experiments` object that Firebase A/B Testing assigns per user. Add
 * real experiments here;
 */
const EXPERIMENTS = {
  chatComposerLayout: {
    variants: ['control', 'compact'],
    control: 'control',
  },
  sevenTvPaintRenderer: {
    variants: ['control', 'skia'],
    control: 'control',
  },
} as const satisfies Record<string, ExperimentDefinition>;

export type ExperimentName = keyof typeof EXPERIMENTS;

export type ExperimentVariant<N extends ExperimentName> =
  (typeof EXPERIMENTS)[N]['variants'][number];

export function resolveExperimentVariant<N extends ExperimentName>(
  name: N,
  assignments: RemoteConfigSchema['experiments'],
): ExperimentVariant<N> {
  const definition = EXPERIMENTS[name];
  const safeAssignments =
    assignments !== null &&
    typeof assignments === 'object' &&
    !Array.isArray(assignments)
      ? assignments
      : {};
  const assigned = safeAssignments[name];

  return assigned !== undefined &&
    (definition.variants as readonly string[]).includes(assigned)
    ? (assigned as ExperimentVariant<N>)
    : definition.control;
}

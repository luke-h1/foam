import { sentrySizeAnalysisBuildConfigurationFor } from './variant';

export const SENTRY_SIZE_ANALYSIS_DEFAULT_ORG = 'foam-tv';
export const SENTRY_SIZE_ANALYSIS_DEFAULT_PROJECT = 'foam-tv-mobile';

export type SentrySizeAnalysisUploadOptions = {
  artifactPath: string;
  variant: string;
  org?: string;
  project?: string;
  headSha?: string;
  baseSha?: string;
  vcsProvider?: string;
  headRepoName?: string;
  baseRepoName?: string;
  headRef?: string;
  baseRef?: string;
  prNumber?: string;
};

export function buildSentrySizeAnalysisUploadArgs(
  options: SentrySizeAnalysisUploadOptions,
): string[] {
  const org = options.org ?? SENTRY_SIZE_ANALYSIS_DEFAULT_ORG;
  const project = options.project ?? SENTRY_SIZE_ANALYSIS_DEFAULT_PROJECT;
  const buildConfiguration = sentrySizeAnalysisBuildConfigurationFor(
    options.variant,
  );

  const args = [
    'build',
    'upload',
    options.artifactPath,
    '--org',
    org,
    '--project',
    project,
    '--build-configuration',
    buildConfiguration,
  ];

  if (options.headSha) {
    args.push('--head-sha', options.headSha);
  }
  if (options.baseSha) {
    args.push('--base-sha', options.baseSha);
  }
  if (options.vcsProvider) {
    args.push('--vcs-provider', options.vcsProvider);
  }
  if (options.headRepoName) {
    args.push('--head-repo-name', options.headRepoName);
  }
  if (options.baseRepoName) {
    args.push('--base-repo-name', options.baseRepoName);
  }
  if (options.headRef) {
    args.push('--head-ref', options.headRef);
  }
  if (options.baseRef) {
    args.push('--base-ref', options.baseRef);
  }
  if (options.prNumber) {
    args.push('--pr-number', options.prNumber);
  }

  return args;
}

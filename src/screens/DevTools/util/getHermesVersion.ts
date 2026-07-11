type HermesRuntimeProperties = {
  'OSS Release Version'?: string;
  'Static Hermes'?: boolean;
};

type HermesInternal = {
  getRuntimeProperties?: () => HermesRuntimeProperties;
};

export function getHermesVersion(): string | undefined {
  const hermes = (globalThis as { HermesInternal?: HermesInternal })
    .HermesInternal;
  const runtime = hermes?.getRuntimeProperties?.() ?? {};
  const version = runtime['OSS Release Version'];
  if (runtime['Static Hermes']) {
    return `${version} (hermes)`;
  }
  return version;
}

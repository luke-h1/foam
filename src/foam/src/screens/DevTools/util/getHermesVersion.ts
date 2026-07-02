/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export function getHermesVersion() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const HERMES_RUNTIME = global.HermesInternal?.getRuntimeProperties?.() ?? {};
  const HERMES_VERSION = HERMES_RUNTIME['OSS Release Version'];
  const isStaticHermes = HERMES_RUNTIME['Static Hermes'];

  if (!HERMES_RUNTIME) {
    return null;
  }

  if (isStaticHermes) {
    return `${HERMES_VERSION} (hermes)`;
  }
  return HERMES_VERSION as string;
}

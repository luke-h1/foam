/**
 * Remove any specified keys from T, that exist on T.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OmitStrict<T, K extends keyof T> = T extends any
  ? Pick<T, Exclude<keyof T, K>>
  : never;

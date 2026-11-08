export const ReadyState = {
  UNINSTANTIATED: -1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type ReadyState = (typeof ReadyState)[keyof typeof ReadyState];

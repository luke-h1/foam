import type { ChangelogPresentOptions } from './Changelog.types';

type ChangelogAndroidState = ChangelogPresentOptions | null;

/**
 * If the Compose sheet never mounts or never fires dismiss, settle as not
 * presented so callers do not hang and later presents are not blocked.
 */
const PRESENT_TIMEOUT_MS = 120_000;

let state: ChangelogAndroidState = null;
let presentResolve: (() => void) | null = null;
let pending: Promise<boolean> | null = null;
let presentTimeout: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function clearPresentTimeout() {
  if (presentTimeout === null) {
    return;
  }
  clearTimeout(presentTimeout);
  presentTimeout = null;
}

export function getChangelogAndroidState(): ChangelogAndroidState {
  return state;
}

export function subscribeChangelogAndroid(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function presentChangelogAndroid(
  options: ChangelogPresentOptions,
): Promise<boolean> {
  if (pending) {
    return pending.then(() => false);
  }

  state = options;
  let settled = false;

  const promise = new Promise<boolean>(resolve => {
    const settle = (presented: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearPresentTimeout();
      presentResolve = null;
      pending = null;
      if (state !== null) {
        state = null;
        emit();
      }
      resolve(presented);
    };

    presentResolve = () => settle(true);
    presentTimeout = setTimeout(() => settle(false), PRESENT_TIMEOUT_MS);
  });

  pending = promise;
  emit();
  return promise;
}

export function dismissChangelogAndroid(): void {
  presentResolve?.();
}

import type { ChangelogPresentOptions } from './Changelog.types';

type ChangelogAndroidState = ChangelogPresentOptions | null;

let state: ChangelogAndroidState = null;
let presentResolve: (() => void) | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
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
  const promise = new Promise<void>(resolve => {
    presentResolve = resolve;
  });
  pending = promise;
  emit();

  return promise.then(() => true);
}

export function dismissChangelogAndroid(): void {
  if (state === null) {
    return;
  }

  const resolve = presentResolve;
  presentResolve = null;
  pending = null;
  state = null;
  emit();
  resolve?.();
}

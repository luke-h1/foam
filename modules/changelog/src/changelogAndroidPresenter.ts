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
): Promise<void> {
  if (pending) {
    return pending;
  }

  state = options;
  emit();

  pending = new Promise(resolve => {
    presentResolve = resolve;
  });

  return pending;
}

export function dismissChangelogAndroid(): void {
  if (state === null) {
    return;
  }

  state = null;
  emit();
  presentResolve?.();
  presentResolve = null;
  pending = null;
}

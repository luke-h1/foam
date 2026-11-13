import type { Hinge, HingeChangeEvent } from 'expo-hinge';

export function getHinge(): Hinge | null {
  return null;
}

export function isAvailable(): boolean {
  return false;
}

export function addHingeListener(_listener: (event: HingeChangeEvent) => void) {
  return { remove: () => undefined };
}

export function useHinge(): Hinge | null {
  return null;
}

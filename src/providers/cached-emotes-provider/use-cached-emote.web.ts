import type { ImageRef } from 'expo-image';

// Web renders the url source directly; there is no shared decoded-ref fast path.
export function useCachedEmote(_url: string, _maxPx?: number): ImageRef | null {
  return null;
}

export function useCachedEmoteAspectRatio(_url: string | null): number | null {
  return null;
}

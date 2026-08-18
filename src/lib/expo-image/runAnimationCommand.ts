import type { Image as ExpoImage } from 'expo-image';

/**
 * Fire-and-forget expo-image animation calls reject once a recycled view
 * detaches (FOAM-TV-MOBILE-AH).
 */
export function runAnimationCommand(
  image: ExpoImage | null,
  command: 'startAnimating' | 'stopAnimating',
): void {
  try {
    image?.[command]?.().catch(() => {});
  } catch {
    // Recycled expo-image view may already be detached.
  }
}

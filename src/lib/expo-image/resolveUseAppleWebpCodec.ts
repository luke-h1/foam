import type { EmoteUrlDescriptor } from '@app/utils/emote/describeEmoteUrl';

type EmoteUrlKind = EmoteUrlDescriptor['kind'];

/**
 * expo-image's Apple WebP codec is faster and lighter but plays animated WebP
 * at the wrong framerate (see expo-image docs on `useAppleWebpCodec`). Force
 * the standards-compliant libwebp path for known-animated urls so chat emotes
 * and picker previews play at full FPS; leave static/unknown urls on the fast
 * Apple codec when `preferAppleCodecForStatic` is set, otherwise expo-image's
 * default.
 */
export function resolveUseAppleWebpCodec(
  urlKind: EmoteUrlKind,
  options?: { preferAppleCodecForStatic?: boolean },
): boolean | undefined {
  if (urlKind === 'animated') {
    return false;
  }
  if (options?.preferAppleCodecForStatic) {
    return true;
  }
  return undefined;
}

import type { EmoteUrlDescriptor } from '@app/utils/emote/describeEmoteUrl';

type EmoteUrlKind = EmoteUrlDescriptor['kind'];

/**
 * expo-image's Apple WebP codec is faster and lighter but plays animated WebP
 * at the wrong framerate (see expo-image docs on `useAppleWebpCodec`). Force
 * the standards-compliant libwebp path for known-animated urls so chat emotes
 * and picker previews play at full FPS; only opt into the Apple codec for urls
 * we can prove are static.
 */
export function resolveUseAppleWebpCodec(
  urlKind: EmoteUrlKind,
  options?: { preferAppleCodecForStatic?: boolean },
): boolean {
  return urlKind === 'static' && options?.preferAppleCodecForStatic === true;
}

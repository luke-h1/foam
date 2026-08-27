import type { EmoteUrlDescriptor } from '@app/utils/emote/describeEmoteUrl';

type EmoteUrlKind = EmoteUrlDescriptor['kind'];

/**
 * The Apple WebP codec plays animated WebP at the wrong framerate; only use
 * it for provably static urls.
 */
export function resolveUseAppleWebpCodec(
  urlKind: EmoteUrlKind,
  options?: { preferAppleCodecForStatic?: boolean },
): boolean {
  return urlKind === 'static' && options?.preferAppleCodecForStatic === true;
}

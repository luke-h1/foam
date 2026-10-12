import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';

const preferredScales: EmoteImageScale[] = ['4x', '3x', '2x', '1x'];

/**
 * Keep this above its caller. The worklets plugin turns each worklet into a
 * `var` assigned in place, so a caller declared first captures `undefined`.
 */
function compactVariantSet(
  variants: EmoteImageVariants['animated'],
): EmoteImageVariants['animated'] | undefined {
  'worklet';

  if (!variants) {
    return undefined;
  }

  const compacted = preferredScales.reduce<
    NonNullable<EmoteImageVariants['animated']>
  >((result, scale) => {
    const url = variants[scale];

    if (url) {
      result[scale] = url;
    }

    return result;
  }, {});

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

export function createEmoteImageVariants({
  animated,
  static: staticVariants,
}: {
  animated?: EmoteImageVariants['animated'];
  static?: EmoteImageVariants['static'];
}): EmoteImageVariants {
  'worklet';

  const resolvedAnimated = compactVariantSet(animated);
  const resolvedStatic = compactVariantSet(staticVariants);

  return {
    ...(resolvedAnimated ? { animated: resolvedAnimated } : null),
    ...(resolvedStatic ? { static: resolvedStatic } : null),
  };
}

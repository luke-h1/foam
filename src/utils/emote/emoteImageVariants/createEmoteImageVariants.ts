import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';

const preferredScales: EmoteImageScale[] = ['4x', '3x', '2x', '1x'];

export function createEmoteImageVariants({
  animated,
  static: staticVariants,
}: {
  animated?: EmoteImageVariants['animated'];
  static?: EmoteImageVariants['static'];
}): EmoteImageVariants {
  const resolvedAnimated = compactVariantSet(animated);
  const resolvedStatic = compactVariantSet(staticVariants);

  return {
    ...(resolvedAnimated ? { animated: resolvedAnimated } : null),
    ...(resolvedStatic ? { static: resolvedStatic } : null),
  };
}

function compactVariantSet(
  variants: EmoteImageVariants['animated'],
): EmoteImageVariants['animated'] | undefined {
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

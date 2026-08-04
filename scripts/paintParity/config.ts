import path from 'node:path';

export const HARNESS = {
  username: process.env.PAINT_USERNAME ?? 'Kappa_Enjoyer',
  // chatLineMetrics.comfortable.fontSize
  fontSize: 14,
  pixelRatio: 3,
  // theme.color.text.dark - what a painted username inherits as currentColor
  fallbackColor: '#EDF1F5',
};

/**
 * Rendered with no paint at all - the same glyphs through both text stacks.
 * Whatever this scores is the floor from SkParagraph and Chrome rasterizing
 * type differently, so painted scores are only meaningful against it.
 */
export const CONTROL_ID = '__control__';

export function outDir(sub?: string): string {
  const base = path.resolve(import.meta.dir, 'out');
  return sub ? path.join(base, sub) : base;
}

/**
 * Sample selection. `PAINT_IDS` (comma separated) or `PAINT_LIMIT` env vars
 * narrow the run; default is every paint in the fixture.
 */
export function selectPaints<T extends { id: string; name: string }>(
  paints: T[],
): T[] {
  const ids = process.env.PAINT_IDS?.split(',').map(id => id.trim());
  if (ids?.length) {
    return paints.filter(paint => ids.includes(paint.id));
  }
  const limit = process.env.PAINT_LIMIT ? Number(process.env.PAINT_LIMIT) : 0;
  return limit > 0 ? paints.slice(0, limit) : paints;
}

import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintLayerData } from '@app/types/seventv/cosmetics';

function paintLayerFingerprint(layer: PaintLayerData): string {
  const stops = indexedCollectionToArray(layer.stops)
    .map(stop => `${stop.at}:${stop.color}`)
    .join(',');
  return [
    layer.function,
    layer.angle,
    layer.shape,
    layer.repeat ? '1' : '0',
    layer.image_url,
    layer.canvas_repeat,
    layer.at?.join(',') ?? '',
    layer.size?.join(',') ?? '',
    stops,
  ].join('|');
}

/**
 * Stable React keys for paint layers. Duplicate identical layers get an
 * occurrence suffix so keys stay unique without using the map index.
 */
export function withPaintLayerKeys(
  layers: PaintLayerData[],
): { layer: PaintLayerData; key: string; layerIndex: number }[] {
  const seen = new Map<string, number>();
  return layers.map((layer, layerIndex) => {
    const fingerprint = paintLayerFingerprint(layer);
    const occurrence = seen.get(fingerprint) ?? 0;
    seen.set(fingerprint, occurrence + 1);
    return {
      layer,
      layerIndex,
      key: occurrence === 0 ? fingerprint : `${fingerprint}#${occurrence}`,
    };
  });
}

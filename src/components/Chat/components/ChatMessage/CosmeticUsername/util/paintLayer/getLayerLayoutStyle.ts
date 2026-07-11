import { StyleSheet, type ViewStyle } from 'react-native';

import type { PaintLayerData } from '@app/types/seventv/cosmetics';

export function getLayerLayoutStyle(layer: PaintLayerData): ViewStyle {
  if (!layer.at && !layer.size) {
    return StyleSheet.absoluteFill;
  }

  // CSS background-position percentage semantics: a position of p% aligns
  // the p% point of the layer with the p% point of the container, i.e.
  // offset = (container - layer) * p.
  const sizeX = layer.size?.[0] ?? 1;
  const sizeY = layer.size?.[1] ?? 1;
  const posX = layer.at?.[0] ?? 0;
  const posY = layer.at?.[1] ?? 0;

  return {
    position: 'absolute',
    left: `${(1 - sizeX) * posX * 100}%`,
    top: `${(1 - sizeY) * posY * 100}%`,
    width: `${sizeX * 100}%`,
    height: `${sizeY * 100}%`,
    overflow: 'hidden',
  };
}

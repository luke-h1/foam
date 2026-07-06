import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

/**
 * Web build: CSS backgrounds tile natively, so the Skia shader is unneeded.
 */
export function PaintLayerTiledImage({
  canvasRepeat,
  imageUrl,
}: PaintLayerTiledImageProps) {
  const cssRepeat =
    canvasRepeat === '' || canvasRepeat === 'unset' || canvasRepeat === 'revert'
      ? 'repeat'
      : canvasRepeat;
  const webBackgroundStyle = {
    backgroundImage: `url(${imageUrl})`,
    backgroundRepeat: cssRepeat,
  } as unknown as ViewStyle;

  return <View style={[StyleSheet.absoluteFill, webBackgroundStyle]} />;
}

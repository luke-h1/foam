import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

type WebBackgroundStyle = ViewStyle & {
  backgroundImage: string;
  backgroundRepeat: string;
};

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
  const webBackgroundStyle: WebBackgroundStyle = {
    // Quoted so CDN URLs with parentheses/whitespace stay valid CSS.
    backgroundImage: `url("${imageUrl.replace(/"/g, '%22')}")`,
    backgroundRepeat: cssRepeat,
  };

  return <View style={[StyleSheet.absoluteFill, webBackgroundStyle]} />;
}

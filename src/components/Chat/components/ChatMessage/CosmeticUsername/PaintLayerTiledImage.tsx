import { StyleSheet } from 'react-native';

import { Canvas, Fill, ImageShader } from '@shopify/react-native-skia';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import { paintLayerTileModes } from './util/paintLayer/paintLayerTileModes';
import { useTiledPaintImage } from './util/tiledPaintImageCache';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

/**
 * Skia image-shader tiling for CSS `background-repeat` paint layers.
 */
export function PaintLayerTiledImage({
  canvasRepeat,
  imageUrl,
}: PaintLayerTiledImageProps) {
  const image = useTiledPaintImage(imageUrl);
  if (!image) {
    return null;
  }

  const { tx, ty } = paintLayerTileModes(canvasRepeat);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <ImageShader image={image} tx={tx} ty={ty} />
      </Fill>
    </Canvas>
  );
}

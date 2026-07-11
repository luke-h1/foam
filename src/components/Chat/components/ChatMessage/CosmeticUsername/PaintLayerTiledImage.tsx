import { StyleSheet } from 'react-native';

import { Canvas, Fill, ImageShader } from '@shopify/react-native-skia';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import { paintLayerTileModes } from './util/paintLayer/paintLayerTileModes';
import { useSharedPaintAnimationFrame } from './util/sharedPaintAnimationFrames';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

/**
 * Skia image-shader tiling for CSS `background-repeat` paint layers.
 * Uses the shared per-URL animation clock so animated tile textures advance
 * on the UI thread in phase with every other row showing the same paint.
 */
export function PaintLayerTiledImage({
  canvasRepeat,
  imageUrl,
}: PaintLayerTiledImageProps) {
  const animatedFrame = useSharedPaintAnimationFrame(imageUrl);

  const { tx, ty } = paintLayerTileModes(canvasRepeat);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <ImageShader image={animatedFrame} tx={tx} ty={ty} />
      </Fill>
    </Canvas>
  );
}

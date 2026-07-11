import { StyleSheet } from 'react-native';

import {
  Canvas,
  Fill,
  ImageShader,
  useAnimatedImageValue,
} from '@shopify/react-native-skia';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import { paintLayerTileModes } from './util/paintLayer/paintLayerTileModes';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

/**
 * Skia image-shader tiling for CSS `background-repeat` paint layers.
 * Uses `useAnimatedImageValue` so animated tile textures advance on the UI
 * thread the same way stretch image layers do.
 */
export function PaintLayerTiledImage({
  canvasRepeat,
  imageUrl,
}: PaintLayerTiledImageProps) {
  const animatedFrame = useAnimatedImageValue(imageUrl);
  if (!animatedFrame) {
    return null;
  }

  const { tx, ty } = paintLayerTileModes(canvasRepeat);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <ImageShader image={animatedFrame} tx={tx} ty={ty} />
      </Fill>
    </Canvas>
  );
}

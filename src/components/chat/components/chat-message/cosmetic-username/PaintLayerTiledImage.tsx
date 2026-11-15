import { StyleSheet } from 'react-native';

import { Canvas, Fill, ImageShader } from '@shopify/react-native-skia';

import type { PaintCanvasRepeat } from '@app/types/seven-tv/cosmetics';

import { paintLayerTileModes } from './util/paint-layer/paintLayerTileModes';
import {
  useSharedPaintAnimationFrame,
  useSharedPaintAnimationReady,
} from './util/sharedPaintAnimationFrames';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

export function PaintLayerTiledImage({
  canvasRepeat,
  imageUrl,
}: PaintLayerTiledImageProps) {
  const textureReady = useSharedPaintAnimationReady(imageUrl);
  const frame = useSharedPaintAnimationFrame(imageUrl);

  const { tx, ty } = paintLayerTileModes(canvasRepeat);

  if (!textureReady || !frame) {
    return null;
  }

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <ImageShader image={frame} tx={tx} ty={ty} />
      </Fill>
    </Canvas>
  );
}

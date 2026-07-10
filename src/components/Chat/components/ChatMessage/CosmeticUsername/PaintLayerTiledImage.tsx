import { StyleSheet } from 'react-native';

import {
  Canvas,
  Fill,
  ImageShader,
  useImage,
} from '@shopify/react-native-skia';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

import { paintLayerTileModes } from './util/paintLayer';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

/**
 * Tiling counterpart to the plain expo-image layer: CSS `background-repeat`
 * paints tile their texture across the username, which expo-image cannot do,
 * so tiled layers render through a Skia image shader instead.
 */
export function PaintLayerTiledImage({
  canvasRepeat,
  imageUrl,
}: PaintLayerTiledImageProps) {
  const image = useImage(imageUrl);
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

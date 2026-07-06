import { StyleSheet } from 'react-native';

import {
  Canvas,
  Fill,
  ImageShader,
  useImage,
} from '@shopify/react-native-skia';

import type { PaintCanvasRepeat } from '@app/types/seventv/cosmetics';

interface PaintLayerTiledImageProps {
  canvasRepeat: PaintCanvasRepeat;
  imageUrl: string;
}

type SkiaTileMode = 'clamp' | 'decal' | 'mirror' | 'repeat';

function tileModes(canvasRepeat: PaintCanvasRepeat): {
  tx: SkiaTileMode;
  ty: SkiaTileMode;
} {
  // `round`/`space` stretch or pad tiles in CSS; plain repetition is the
  // closest Skia equivalent and matches how the texture is meant to fill.
  switch (canvasRepeat) {
    case 'repeat-x':
      return { tx: 'repeat', ty: 'decal' };
    case 'repeat-y':
      return { tx: 'decal', ty: 'repeat' };
    default:
      return { tx: 'repeat', ty: 'repeat' };
  }
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

  const { tx, ty } = tileModes(canvasRepeat);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <ImageShader image={image} tx={tx} ty={ty} />
      </Fill>
    </Canvas>
  );
}

import { useMemo } from 'react';
import { PixelRatio } from 'react-native';

import {
  Canvas,
  Fill,
  Image,
  ImageShader,
  Mask,
  useAnimatedImageValue,
  useFonts,
  useImage,
} from '@shopify/react-native-skia';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import {
  getPaintBitmaps,
  type PaintBitmaps,
} from './util/skiaPaintedUsernameRasterizer';

const skiaFontSource = {
  Montserrat: [
    require('@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf'),
    require('@expo-google-fonts/montserrat/500Medium/Montserrat_500Medium.ttf'),
    require('@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf'),
    require('@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf'),
    require('@expo-google-fonts/montserrat/800ExtraBold/Montserrat_800ExtraBold.ttf'),
    require('@expo-google-fonts/montserrat/900Black/Montserrat_900Black.ttf'),
  ],
};

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  /**
   * Glyph size in points; defaults to the chat row metric. Passed through so
   * painted names render at the right size outside chat (composer, user card).
   */
  fontSize?: number;
}

/**
 * Canvas for a resolved paint: the cached static composite as one bitmap, plus
 * (for image-layer paints) the texture overlaid through the glyph mask. The
 * overlay frame comes from `useAnimatedImageValue`, which advances on the UI
 * thread, so animated paints animate at the texture's own frame rate with no
 * per-frame JS and no re-rasterizing.
 */
function PaintBitmapCanvas({ bitmaps }: { bitmaps: PaintBitmaps }) {
  const { animatedTile } = bitmaps;
  const animatedFrame = useAnimatedImageValue(
    animatedTile ? undefined : (bitmaps.animatedUrl ?? undefined),
  );
  const tiledImage = useImage(
    animatedTile ? (bitmaps.animatedUrl ?? undefined) : undefined,
  );

  const maskNode = useMemo(
    () =>
      bitmaps.maskImage ? (
        <Image
          image={bitmaps.maskImage}
          x={0}
          y={0}
          width={bitmaps.width}
          height={bitmaps.height}
          fit='fill'
        />
      ) : null,
    [bitmaps],
  );

  const { width, height, insets, staticImage, animatedRect } = bitmaps;

  const tiledOverlay =
    maskNode && animatedTile && tiledImage ? (
      <Mask mode='alpha' mask={maskNode}>
        <Fill>
          <ImageShader
            image={tiledImage}
            tx={animatedTile.tx}
            ty={animatedTile.ty}
          />
        </Fill>
      </Mask>
    ) : null;

  const stretchOverlay =
    maskNode && !animatedTile && animatedRect ? (
      <Mask mode='alpha' mask={maskNode}>
        <Image
          image={animatedFrame}
          x={animatedRect.x}
          y={animatedRect.y}
          width={animatedRect.width}
          height={animatedRect.height}
          fit='fill'
        />
      </Mask>
    ) : null;

  return (
    <Canvas
      style={{
        width,
        height,
        marginLeft: -insets.left,
        marginTop: -insets.top,
        marginRight: -insets.right,
        marginBottom: -insets.bottom,
      }}
    >
      <Image
        image={staticImage}
        x={0}
        y={0}
        width={width}
        height={height}
        fit='fill'
      />
      {tiledOverlay}
      {stretchOverlay}
    </Canvas>
  );
}

/**
 * Renders a painted username with Skia. The static composite (gradients, base
 * fill, drop shadows) is baked once into a cached bitmap and reused across
 * mounts and every user wearing the paint; image-layer paints animate their
 * texture on the UI thread. Negative margins collapse the shadow overflow
 * margin so the glyphs align with neighbouring text.
 */
export function PaintedUsernameSkia({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
  fontSize = chatLineMetrics.comfortable.fontSize,
}: PaintedUsernameSkiaProps) {
  const fontProvider = useFonts(skiaFontSource);
  const pixelRatio = PixelRatio.get();

  const bitmaps = useMemo(
    () =>
      fontProvider
        ? getPaintBitmaps({
            displayUsername: username,
            paint,
            fallbackColor,
            fontSize,
            pixelRatio,
            fontProvider,
            fontFamily: 'Montserrat',
          })
        : null,
    [fontProvider, username, paint, fallbackColor, fontSize, pixelRatio],
  );

  if (!bitmaps) {
    return (
      <Text style={{ ...chatLineMetrics.comfortable, color: fallbackColor }}>
        {username}
      </Text>
    );
  }

  return <PaintBitmapCanvas bitmaps={bitmaps} />;
}

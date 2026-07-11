import { useEffect, useMemo, useState } from 'react';

import type { SkPicture } from '@shopify/react-native-skia';
import {
  Canvas,
  createPicture,
  Picture,
  Skia,
  useFonts,
} from '@shopify/react-native-skia';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import {
  buildPaintLayout,
  decodePaintLayerImages,
  drawPaintedUsername,
  type PaintUsernameLayout,
  type RasterizePaintedUsernameOptions,
} from './skiaPaintedUsernameRasterizer';

// The chat renders painted usernames in Montserrat 700; loading that face keeps
// glyph shapes and metrics identical to the RN Text path. The lighter/heavier
// faces cover paints that set an explicit `textStyle.weight`, which the
// extension renders as `weight * 100`; Skia then shapes from the matching face.
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

// Frame ticker floor: never redraw faster than ~30fps even if a texture claims
// a shorter frame duration, to bound the per-frame paragraph re-shaping cost.
const MIN_FRAME_MS = 33;

interface SkiaPaintedUsernamePocProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

/**
 * POC: renders a painted username with a live Skia canvas. Static paints draw
 * one picture; animated image (URL) layers advance their frames on a ticker and
 * re-record the picture, so the paint genuinely animates like the extension
 * instead of freezing on a still. Negative margins collapse the shadow overflow
 * margin so the glyph box aligns with neighbouring text.
 *
 * The canvas is retina-backed, so layout/draw run in logical units
 * (`pixelRatio: 1`); the native backing supplies the device scale.
 */
export function SkiaPaintedUsernamePoc({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
}: SkiaPaintedUsernamePocProps) {
  const fontProvider = useFonts(skiaFontSource);
  const [picture, setPicture] = useState<SkPicture | null>(null);

  const opts = useMemo<RasterizePaintedUsernameOptions | null>(
    () =>
      fontProvider
        ? {
            displayUsername: username,
            paint,
            fallbackColor,
            fontSize: chatLineMetrics.comfortable.fontSize,
            pixelRatio: 1,
            fontProvider,
            fontFamily: 'Montserrat',
          }
        : null,
    [fontProvider, username, paint, fallbackColor],
  );

  const layout = useMemo<PaintUsernameLayout | null>(
    () => (opts ? buildPaintLayout(opts) : null),
    [opts],
  );

  useEffect(() => {
    if (!opts || !layout) {
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bounds = Skia.XYWHRect(
      0,
      0,
      layout.surfaceWidthPx,
      layout.surfaceHeightPx,
    );

    decodePaintLayerImages(paint)
      .then(
        decoded => decoded,
        () => null,
      )
      .then(decoded => {
        if (!active || !decoded) {
          return;
        }
        const record = () =>
          createPicture(
            canvas => drawPaintedUsername(canvas, opts, layout, decoded.frames),
            bounds,
          );
        setPicture(record());

        if (decoded.animated.size === 0) {
          return;
        }
        const tick = () => {
          if (!active) {
            return;
          }
          let nextDelay = 100;
          for (const [url, animated] of decoded.animated) {
            const delay = animated.decodeNextFrame();
            const frame = animated.getCurrentFrame();
            if (frame) {
              decoded.frames.set(url, frame);
            }
            if (delay > 0) {
              nextDelay = Math.min(nextDelay, delay);
            }
          }
          setPicture(record());
          timer = setTimeout(tick, Math.max(nextDelay, MIN_FRAME_MS));
        };
        timer = setTimeout(tick, MIN_FRAME_MS);
      });

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [opts, layout, paint]);

  if (!layout || !picture) {
    return (
      <Text style={{ ...chatLineMetrics.comfortable, color: fallbackColor }}>
        {username}
      </Text>
    );
  }

  return (
    <Canvas
      style={{
        width: layout.surfaceWidthPx,
        height: layout.surfaceHeightPx,
        marginLeft: -layout.insetsPx.left,
        marginTop: -layout.insetsPx.top,
        marginRight: -layout.insetsPx.right,
        marginBottom: -layout.insetsPx.bottom,
      }}
    >
      <Picture picture={picture} />
    </Canvas>
  );
}

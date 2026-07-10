import { useEffect, useState } from 'react';
import { PixelRatio } from 'react-native';

import { useFonts } from '@shopify/react-native-skia';
import { Image } from 'expo-image';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import {
  type RasterizedPaintedUsername,
  rasterizePaintedUsername,
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

interface SkiaPaintedUsernamePocProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

/**
 * POC: renders a painted username by rasterizing it once with Skia
 * (`rasterizePaintedUsername`) and displaying the bitmap via expo-image —
 * the production shape would cache the bitmap per (paint, username, fontSize)
 * like an emote. Negative margins collapse the shadow overflow margin so the
 * glyph box aligns with neighbouring text, the way CSS lets `drop-shadow()`
 * paint outside the layout box.
 */
export function SkiaPaintedUsernamePoc({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
}: SkiaPaintedUsernamePocProps) {
  const fontProvider = useFonts(skiaFontSource);
  const [raster, setRaster] = useState<RasterizedPaintedUsername | null>(null);

  useEffect(() => {
    if (!fontProvider) {
      return;
    }
    // Image (URL) layers decode asynchronously, so rasterization is async. The
    // `active` guard drops results from a superseded paint; until the new
    // raster lands the previous frame stays (chat keys a row per user, so a
    // given instance keeps one paint for its lifetime).
    let active = true;
    rasterizePaintedUsername({
      displayUsername: username,
      paint,
      fallbackColor,
      fontSize: chatLineMetrics.comfortable.fontSize,
      pixelRatio: PixelRatio.get(),
      fontProvider,
      fontFamily: 'Montserrat',
    })
      .then(
        result => result,
        () => null,
      )
      .then(result => {
        if (active) {
          setRaster(result);
        }
      });

    return () => {
      active = false;
    };
  }, [fontProvider, username, paint, fallbackColor]);

  if (!raster) {
    return (
      <Text style={{ ...chatLineMetrics.comfortable, color: fallbackColor }}>
        {username}
      </Text>
    );
  }

  return (
    <Image
      source={{ uri: raster.uri }}
      style={{
        width: raster.width,
        height: raster.height,
        marginLeft: -raster.insets.left,
        marginTop: -raster.insets.top,
        marginRight: -raster.insets.right,
        marginBottom: -raster.insets.bottom,
      }}
    />
  );
}

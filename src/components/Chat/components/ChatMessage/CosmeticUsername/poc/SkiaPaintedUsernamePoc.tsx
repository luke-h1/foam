import { useMemo } from 'react';
import { PixelRatio } from 'react-native';

import { useFonts } from '@shopify/react-native-skia';
import { Image } from 'expo-image';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { rasterizePaintedUsername } from './skiaPaintedUsernameRasterizer';

// The chat renders painted usernames in Montserrat 700 (Text weight 'bold');
// loading the same face into Skia keeps glyph shapes and metrics identical to
// the RN Text path, so the raster drops in without shifting layout.
const skiaFontSource = {
  Montserrat: [
    require('@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf'),
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

  const raster = useMemo(() => {
    if (!fontProvider) {
      return null;
    }
    return rasterizePaintedUsername({
      displayUsername: username,
      paint,
      fallbackColor,
      fontSize: chatLineMetrics.comfortable.fontSize,
      pixelRatio: PixelRatio.get(),
      fontProvider,
      fontFamily: 'Montserrat',
    });
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

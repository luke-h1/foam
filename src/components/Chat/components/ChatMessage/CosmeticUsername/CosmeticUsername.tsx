import { memo } from 'react';
import { Platform, type StyleProp, StyleSheet, TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { useChatScrollActive } from '@app/components/Chat/util/useChatScrollActive';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameHtml } from './PaintedUsernameHtml';
import {
  DEFAULT_PAINT_DROP_SHADOW_MODE,
  type PaintDropShadowMode,
} from './util/paintLayer';

interface PaintedUsernameProps {
  username: string;
  paint?: PaintData;
  userId?: string;
  fallbackColor?: string;
  showColon?: boolean;
  sevenTvPaintDropShadows?: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
}

interface PaintedUsernameWithPaintProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
}

function PaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  paint,
  sevenTvPaintDropShadows,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  return (
    <PaintedUsernameHtml
      displayUsername={displayUsername}
      fallbackColor={fallbackColor}
      paint={paint}
      sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      usernameTextStyle={usernameTextStyle}
    />
  );
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = theme.color.text.dark,
  showColon = true,
  sevenTvPaintDropShadows: sevenTvPaintDropShadowsProp,
  usernameTextStyle,
}: PaintedUsernameProps) {
  const sevenTvPaintDropShadows =
    sevenTvPaintDropShadowsProp ?? DEFAULT_PAINT_DROP_SHADOW_MODE;
  const displayUsername = showColon ? `${username}: ` : username;
  const storePaint = useSelector(() => {
    if (!userId) {
      return null;
    }

    const paintId = chatStore$.userPaintIds[userId]?.get();
    return paintId ? chatStore$.paints[paintId]?.get() : null;
  });
  const paint = paintProp ?? storePaint ?? null;
  const isScrolling = useChatScrollActive();

  if (!paint) {
    return (
      <Text
        style={[
          styles.plainUsername,
          { color: fallbackColor },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </Text>
    );
  }

  if (Platform.OS !== 'web' && isScrolling) {
    const solidFallback =
      paint.color === null ? fallbackColor : sevenTvColorToCss(paint.color);

    return (
      <Text
        style={[
          styles.plainUsername,
          { color: solidFallback },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </Text>
    );
  }

  return (
    <PaintedUsernameWithPaint
      displayUsername={displayUsername}
      fallbackColor={fallbackColor}
      paint={paint}
      sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      usernameTextStyle={usernameTextStyle}
    />
  );
}

const styles = StyleSheet.create({
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);

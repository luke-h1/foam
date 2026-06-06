import { memo } from 'react';
import { chatStore$ } from '@app/store/chatStore/state';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { useSelector } from '@legendapp/state/react';
import MaskedView from '@react-native-masked-view/masked-view';
import { type StyleProp, TextStyle, View, StyleSheet } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameFill } from './PaintedUsernameFill';
import {
  DEFAULT_PAINT_DROP_SHADOW_MODE,
  getPaintDropShadows,
  paintShadowKey,
  type PaintDropShadowMode,
} from './util/paintLayer';
import { buildPaintUsernameTextStyle } from './util/paintTextStyle';

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
  const dropShadowMode = sevenTvPaintDropShadows;
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const dropShadows = getPaintDropShadows(paint, dropShadowMode);

  const maskTextStyle = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ] as StyleProp<TextStyle>;

  const paintStack = (
    <PaintedUsernameFill
      displayUsername={displayUsername}
      fallbackColor={fallbackColor}
      paint={paint}
      usernameTextStyle={usernameTextStyle}
    />
  );

  return (
    <View style={styles.paintedWrapper}>
      {dropShadows.map(shadow => (
        <PaintedUsernameDropShadowLayer
          key={paintShadowKey(shadow)}
          displayUsername={displayUsername}
          fallbackColor={fallbackColor}
          maskTextStyle={maskTextStyle}
          paint={paint}
          shadow={shadow}
          usernameTextStyle={usernameTextStyle}
        />
      ))}
      <MaskedView
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[maskTextStyle, { color: 'black' }]}>
              {displayUsername}
            </Text>
          </View>
        }
      >
        {paintStack}
      </MaskedView>
    </View>
  );
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = '#FFFFFF',
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

  const solidFallback =
    paint.color === null ? fallbackColor : sevenTvColorToCss(paint.color);

  return (
    <PaintedUsernameWithPaint
      displayUsername={displayUsername}
      fallbackColor={solidFallback}
      paint={paint}
      sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      usernameTextStyle={usernameTextStyle}
    />
  );
}

const styles = StyleSheet.create({
  maskContainer: {
    backgroundColor: 'transparent',
  },
  maskText: {
    ...chatLineMetrics.comfortable,
    color: 'black',
    fontWeight: 'bold',
  },
  paintedWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);

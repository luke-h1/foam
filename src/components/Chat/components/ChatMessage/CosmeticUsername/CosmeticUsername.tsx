import { memo, useMemo } from 'react';
import {
  Platform,
  type StyleProp,
  StyleSheet,
  TextStyle,
  View,
} from 'react-native';

import {
  isNativePaintedUsernameAvailable,
  NativePaintedUsernameView,
  serializeNativePaintDefinition,
} from '@modules/painted-username/src';
import { useSelector } from '@legendapp/state/react';

import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import { PaintedUsernameStrokeLayer } from './PaintedUsernameStrokeLayer';
import {
  DEFAULT_PAINT_DROP_SHADOW_MODE,
  getPaintDropShadows,
  type PaintDropShadowMode,
  paintShadowKey,
} from './util/paintLayer';
import {
  buildPaintUsernameTextStyle,
  getPaintTextShadows,
  getPaintTextStroke,
  scaleNativeDropShadow,
} from './util/paintTextStyle';

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

function JsPaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  paint,
  sevenTvPaintDropShadows,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const dropShadows = getPaintDropShadows(paint, sevenTvPaintDropShadows).map(
    scaleNativeDropShadow,
  );
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);

  const maskTextStyle = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ] as StyleProp<TextStyle>;

  const underlayShadows = [
    ...dropShadows.map(shadow => ({ shadow, source: 'drop' as const })),
    ...textShadows.map(shadow => ({ shadow, source: 'text' as const })),
  ];

  return (
    <View style={styles.paintedWrapper}>
      {underlayShadows.map(({ shadow, source }, index) => (
        <PaintedUsernameDropShadowLayer
          // Static, never-reordered list; index disambiguates identical shadows.
          // eslint-disable-next-line react-doctor/no-array-index-as-key
          key={`${source}-${index}-${paintShadowKey(shadow)}`}
          displayUsername={displayUsername}
          maskTextStyle={maskTextStyle}
          shadow={shadow}
        />
      ))}
      <PaintedUsernameMaskedFill
        displayUsername={displayUsername}
        fallbackColor={fallbackColor}
        paint={paint}
        maskTextStyle={maskTextStyle}
        sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      />
      {stroke ? (
        <PaintedUsernameStrokeLayer
          displayUsername={displayUsername}
          maskTextStyle={maskTextStyle}
          stroke={stroke}
        />
      ) : null}
    </View>
  );
}

function NativePaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  paint,
  sevenTvPaintDropShadows,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const serializedPaint = useMemo(
    () => serializeNativePaintDefinition(paint, sevenTvPaintDropShadows),
    [paint, sevenTvPaintDropShadows],
  );
  const fontWeight = String(paintTextStyle.fontWeight ?? '700');

  return (
    <NativePaintedUsernameView
      text={displayUsername}
      paint={serializedPaint}
      fallbackColor={fallbackColor}
      fontSize={chatLineMetrics.comfortable.fontSize}
      lineHeight={chatLineMetrics.comfortable.lineHeight}
      fontWeight={fontWeight}
      textTransform={paintTextStyle.textTransform}
      style={[styles.paintedWrapper, usernameTextStyle]}
    />
  );
}

function PaintedUsernameWithPaint(props: PaintedUsernameWithPaintProps) {
  if (Platform.OS === 'web') {
    const paintTextStyle = buildPaintUsernameTextStyle(props.paint);
    const maskTextStyle = [
      styles.maskText,
      props.usernameTextStyle,
      paintTextStyle,
    ] as StyleProp<TextStyle>;

    return (
      <View style={styles.paintedWrapper}>
        <PaintedUsernameMaskedFill
          displayUsername={props.displayUsername}
          fallbackColor={props.fallbackColor}
          paint={props.paint}
          maskTextStyle={maskTextStyle}
          sevenTvPaintDropShadows={props.sevenTvPaintDropShadows}
        />
      </View>
    );
  }

  if (isNativePaintedUsernameAvailable) {
    return <NativePaintedUsernameWithPaint {...props} />;
  }

  return <JsPaintedUsernameWithPaint {...props} />;
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
  maskText: {
    ...chatLineMetrics.comfortable,
    color: 'black',
    fontWeight: 'bold',
  },
  paintedWrapper: {
    alignSelf: 'flex-start',
    overflow: 'visible',
    position: 'relative',
  },
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);

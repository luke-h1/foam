import { memo } from 'react';
import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import { useUserPaint } from '@app/store/chat/react/user-cosmetics';
import { usePaintRenderer } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { ChatRowText } from '../ChatRowText';
import { getChatRowTextStyleForProp } from '../util/chatRowTextStyle';
import { chatLineMetrics } from '../util/chatScale';
import { PaintedUsernameHostedLayers } from './PaintedUsernameHostedLayers';
import { PaintedUsernameSkia } from './PaintedUsernameSkia';
import { getPaintBaseColor } from './util/paint-layer/getPaintBaseColor';

interface PaintedUsernameProps {
  username: string;
  paint?: PaintData;
  userId?: string;
  fallbackColor?: string;
  isModerated: boolean;
  showColon?: boolean;
  usernameTextStyle?: StyleProp<TextStyle>;
}

interface PaintedUsernameWithPaintProps {
  displayUsername: string;
  fallbackColor: string;
  fontSize?: number;
  lineHeight?: number;
  isModerated: boolean;
  opacity?: number;
  paint: PaintData;
  plainColor: string;
  usernameTextStyle?: StyleProp<TextStyle>;
}

function PaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  fontSize,
  lineHeight,
  isModerated,
  opacity,
  paint,
  plainColor,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const paintRenderer = usePaintRenderer();

  if (paintRenderer === 'off') {
    return (
      <ChatRowText
        style={getChatRowTextStyleForProp('muted', [
          styles.plainUsername,
          getChatColorStyle(plainColor),
          usernameTextStyle,
        ])}
      >
        {displayUsername}
      </ChatRowText>
    );
  }

  if (paintRenderer === 'skia') {
    return (
      <PaintedUsernameSkia
        {...{
          username: displayUsername,
          paint,
          fallbackColor,
          fontSize,
          lineHeight,
          opacity,
          strikethrough: isModerated,
        }}
      />
    );
  }

  return (
    <PaintedUsernameHostedLayers
      {...{
        displayUsername,
        fallbackColor,
        fontSize,
        lineHeight,
        paint,
        plainColor,
        usernameTextStyle,
        useWebView: paintRenderer === 'webview' && !isModerated,
      }}
    />
  );
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = theme.color.text.dark,
  isModerated,
  showColon = true,
  usernameTextStyle,
}: PaintedUsernameProps) {
  const displayUsername = showColon ? `${username}: ` : username;

  const storePaint = useUserPaint(userId);

  const paint = paintProp ?? storePaint;

  if (!paint) {
    return (
      <ChatRowText
        style={getChatRowTextStyleForProp('muted', [
          styles.plainUsername,
          getChatColorStyle(fallbackColor),
          usernameTextStyle,
        ])}
      >
        {displayUsername}
      </ChatRowText>
    );
  }

  const flatUsernameStyle = StyleSheet.flatten(usernameTextStyle);

  return (
    <PaintedUsernameWithPaint
      {...{
        displayUsername,
        fallbackColor: getPaintBaseColor(paint, fallbackColor),
        fontSize: flatUsernameStyle?.fontSize,
        lineHeight: flatUsernameStyle?.lineHeight,
        isModerated,
        opacity: flatUsernameStyle?.opacity,
        paint,
        plainColor: fallbackColor,
        usernameTextStyle,
      }}
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

import { memo } from 'react';
import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { useUserPaint } from '@app/store/chat/react/user-cosmetics';
import { usePaintRenderer } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

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
  paint,
  plainColor,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const paintRenderer = usePaintRenderer();

  if (paintRenderer === 'off') {
    return (
      <ChatText
        style={[styles.plainUsername, { color: plainColor }, usernameTextStyle]}
      >
        {displayUsername}
      </ChatText>
    );
  }

  // Skia keeps the paint during a fling. Deleted names stay on the hosted
  // fill so the strikethrough still draws. That fill sheds on native only.
  if (paintRenderer === 'skia' && !isModerated) {
    return (
      <PaintedUsernameSkia
        {...{
          username: displayUsername,
          paint,
          fallbackColor,
          fontSize,
          lineHeight,
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
      <ChatText
        style={[
          styles.plainUsername,
          { color: fallbackColor },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </ChatText>
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

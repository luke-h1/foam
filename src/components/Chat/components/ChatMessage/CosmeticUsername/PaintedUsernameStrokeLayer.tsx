import { type StyleProp, StyleSheet, TextStyle } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintTextStroke } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

interface PaintedUsernameStrokeLayerProps {
  displayUsername: string;
  maskTextStyle: StyleProp<TextStyle>;
  stroke: PaintTextStroke;
}

const STROKE_UNIT_OFFSETS = [
  { width: -1, height: 0 },
  { width: 1, height: 0 },
  { width: 0, height: -1 },
  { width: 0, height: 1 },
  { width: -1, height: -1 },
  { width: -1, height: 1 },
  { width: 1, height: -1 },
  { width: 1, height: 1 },
] as const;

/**
 * Approximates `-webkit-text-stroke` on top of the painted fill by ringing
 * transparent glyphs with same-position text-shadow copies in the stroke color.
 */
export function PaintedUsernameStrokeLayer({
  displayUsername,
  maskTextStyle,
  stroke,
}: PaintedUsernameStrokeLayerProps) {
  const strokeColor = sevenTvColorToCss(stroke.color);
  const radius = Math.max(1, Math.round(stroke.width));
  const offsets = STROKE_UNIT_OFFSETS.map(offset => ({
    width: offset.width * radius,
    height: offset.height * radius,
  }));

  return (
    <>
      {offsets.map(offset => (
        <Text
          key={`stroke-${offset.width}-${offset.height}`}
          pointerEvents='none'
          style={[
            styles.strokeText,
            maskTextStyle,
            {
              color: 'transparent',
              textShadowColor: strokeColor,
              textShadowOffset: offset,
              textShadowRadius: 0,
            },
          ]}
        >
          {displayUsername}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  strokeText: {
    position: 'absolute',
    zIndex: 1,
  },
});

import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';

import { MaskedView } from '@expo/ui/community/masked-view';

import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { ChatRowText } from '../ChatRowText';
import { getChatRowTextStyleForProp } from '../util/chatRowTextStyle';
import { PaintedUsernameFill } from './PaintedUsernameFill';

interface PaintedUsernameMaskedFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  maskTextStyle: StyleProp<TextStyle>;
}

/**
 * Clips the painted fill to the username glyphs via Expo UI MaskedView;
 * avoids @react-native-masked-view's Fabric recycle SIGABRT under row churn.
 */
export function PaintedUsernameMaskedFill({
  displayUsername,
  fallbackColor,
  paint,
  maskTextStyle,
}: PaintedUsernameMaskedFillProps) {
  return (
    <View style={styles.root}>
      <ChatRowText
        style={getChatRowTextStyleForProp('muted', [
          maskTextStyle,
          getChatColorStyle(fallbackColor),
        ])}
      >
        {displayUsername}
      </ChatRowText>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View style={styles.maskContainer}>
            <ChatRowText
              style={getChatRowTextStyleForProp('muted', [
                maskTextStyle,
                styles.maskGlyph,
              ])}
            >
              {displayUsername}
            </ChatRowText>
          </View>
        }
      >
        <PaintedUsernameFill
          displayUsername={displayUsername}
          fallbackColor={fallbackColor}
          paint={paint}
          textStyle={maskTextStyle}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  maskContainer: {
    backgroundColor: 'transparent',
  },
  maskGlyph: {
    color: 'black',
  },
  root: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
});

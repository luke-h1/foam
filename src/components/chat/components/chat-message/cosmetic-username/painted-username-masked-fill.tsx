import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { MaskedView } from '@expo/ui/community/masked-view';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { PaintedUsernameFill } from './painted-username-fill';

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
      <ChatText style={[maskTextStyle, { color: fallbackColor }]}>
        {displayUsername}
      </ChatText>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View style={styles.maskContainer}>
            <ChatText style={[maskTextStyle, styles.maskGlyph]}>
              {displayUsername}
            </ChatText>
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

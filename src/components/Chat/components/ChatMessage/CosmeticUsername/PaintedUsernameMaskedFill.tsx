import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { MaskedView } from '@expo/ui/community/masked-view';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { PaintedUsernameFill } from './PaintedUsernameFill';

interface PaintedUsernameMaskedFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  maskTextStyle: StyleProp<TextStyle>;
}

/**
 * Clips the painted fill to the username glyphs via Expo UI MaskedView
 * (SwiftUI `.mask` / Compose `DstIn`). Avoids @react-native-masked-view's
 * Fabric recycle SIGABRT under painted-row churn.
 */
export function PaintedUsernameMaskedFill({
  displayUsername,
  fallbackColor,
  paint,
  maskTextStyle,
}: PaintedUsernameMaskedFillProps) {
  return (
    <View style={styles.root}>
      <Text style={[maskTextStyle, { color: fallbackColor }]}>
        {displayUsername}
      </Text>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[maskTextStyle, styles.maskGlyph]}>
              {displayUsername}
            </Text>
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

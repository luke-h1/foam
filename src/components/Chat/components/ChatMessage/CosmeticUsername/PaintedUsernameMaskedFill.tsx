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
 * Clips the painted gradient/texture fill to the username glyphs.
 *
 * Uses Expo UI's MaskedView (SwiftUI `.mask` on iOS, Compose `BlendMode.DstIn`
 * on Android) rather than @react-native-masked-view, whose legacy Paper view
 * manager reparents React-managed children (`self.maskView` + `addSubview`)
 * under Fabric interop. Under fast painted-row churn on busy channels that
 * left a deleted view still mounted, tripping RCTComponentViewRegistry's
 * "Attempt to recycle a mounted view" assertion (SIGABRT in debug, a native
 * use-after-free in release).
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

import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { MaskedView } from '@expo/ui/community/masked-view';
import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
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
 *
 * Expo UI renders the mask and content through absolutely-filled SwiftUI hosts,
 * so the MaskedView has no intrinsic size. An invisible in-flow sizer Text
 * establishes the box from the same glyph metrics; the MaskedView then fills it.
 */
export function PaintedUsernameMaskedFill({
  displayUsername,
  fallbackColor,
  paint,
  maskTextStyle,
}: PaintedUsernameMaskedFillProps) {
  return (
    <View style={styles.root}>
      <Text style={[maskTextStyle, styles.sizer]}>{displayUsername}</Text>
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
  sizer: {
    opacity: 0,
  },
});

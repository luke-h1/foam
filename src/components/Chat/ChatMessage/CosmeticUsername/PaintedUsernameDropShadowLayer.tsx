import type {
  PaintData,
  PaintShadow,
} from '@app/utils/color/seventv-ws-service';
import MaskedView from '@react-native-masked-view/masked-view';
import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { PaintedUsernameFill } from './PaintedUsernameFill';
import { paintShadowToTextStyle } from './util/paintLayer';

const styles = StyleSheet.create({
  maskContainer: {
    backgroundColor: 'transparent',
  },
  shadowMaskedView: {
    ...StyleSheet.absoluteFill,
  },
});

interface PaintedUsernameDropShadowLayerProps {
  displayUsername: string;
  fallbackColor: string;
  maskTextStyle: StyleProp<TextStyle>;
  paint: PaintData;
  shadow: PaintShadow;
  usernameTextStyle?: StyleProp<TextStyle>;
}

export function PaintedUsernameDropShadowLayer({
  displayUsername,
  fallbackColor,
  maskTextStyle,
  paint,
  shadow,
  usernameTextStyle,
}: PaintedUsernameDropShadowLayerProps) {
  return (
    <MaskedView
      maskElement={
        <View style={styles.maskContainer}>
          <Text
            style={[
              maskTextStyle,
              paintShadowToTextStyle(shadow),
              { color: 'black' },
            ]}
          >
            {displayUsername}
          </Text>
        </View>
      }
      pointerEvents='none'
      style={styles.shadowMaskedView}
    >
      <PaintedUsernameFill
        displayUsername={displayUsername}
        fallbackColor={fallbackColor}
        paint={paint}
        usernameTextStyle={usernameTextStyle}
      />
    </MaskedView>
  );
}

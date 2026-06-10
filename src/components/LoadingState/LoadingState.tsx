import { theme } from '@app/styles/themes';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import type {
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface LoadingStateProps {
  indicatorSize?: ActivityIndicatorProps['size'];
  style?: StyleProp<ViewStyle>;
}

const SPINNER_SIZES: Record<'small' | 'large', number> = {
  small: 20,
  large: 36,
};
const STROKE_WIDTH = 3;
const ROTATION_DURATION_MS = 900;
const ARC_SWEEP_DEGREES = 270;

export function LoadingState({
  indicatorSize = 'large',
  style,
}: LoadingStateProps) {
  const size =
    typeof indicatorSize === 'number'
      ? indicatorSize
      : SPINNER_SIZES[indicatorSize];

  return (
    <View style={[styles.container, style]}>
      <Spinner size={size} />
    </View>
  );
}

function Spinner({ size }: { size: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.set(
      withRepeat(
        withTiming(2 * Math.PI, {
          duration: ROTATION_DURATION_MS,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
  }, [rotation]);

  const transform = useDerivedValue(() => [{ rotate: rotation.value }]);

  const inset = STROKE_WIDTH / 2;
  const arc = Skia.Path.Make();
  arc.addArc(
    Skia.XYWHRect(inset, inset, size - STROKE_WIDTH, size - STROKE_WIDTH),
    0,
    ARC_SWEEP_DEGREES,
  );

  return (
    <Canvas style={{ width: size, height: size }}>
      <Path
        path={arc}
        style='stroke'
        strokeWidth={STROKE_WIDTH}
        strokeCap='round'
        color={theme.color.text.dark}
        transform={transform}
        origin={{ x: size / 2, y: size / 2 }}
      />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
  },
});

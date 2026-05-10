import { LAVA_LAMP_SOURCE } from '@app/components/LiquidBackdrop/shaders';
import {
  Canvas,
  LinearGradient,
  Rect,
  Shader,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BACKGROUND_HEIGHT = SCREEN_HEIGHT * 0.6;

export function LiquidBackdrop() {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(1000, { duration: 1000000, easing: Easing.linear }),
      -1,
    );
  }, [time]);

  const uniforms = useDerivedValue(
    () => ({
      time: time.value,
      size: vec(size.width, size.height),
    }),
    [size, time],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(2000)}
      onLayout={onLayout}
      style={styles.container}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect height={size.height} width={size.width} x={0} y={0}>
          <Shader source={LAVA_LAMP_SOURCE} uniforms={uniforms} />
        </Rect>
        <Rect height={size.height} width={size.width} x={0} y={0}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(0,0,0,0.2)',
              'rgba(0,0,0,0.6)',
              'rgba(0,0,0,0.9)',
            ]}
            end={vec(0, size.height)}
            positions={[0, 0.4, 0.75, 1]}
            start={vec(0, 0)}
          />
        </Rect>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BACKGROUND_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

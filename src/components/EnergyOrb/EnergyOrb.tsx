import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

import {
  Canvas,
  Fill,
  Shader,
  Skia,
  type Uniforms,
} from '@shopify/react-native-skia';

import { useScreenFocused } from '@app/hooks/useScreenFocused';

import {
  DEFAULT_COLORS,
  DEFAULT_GLOW_RADIUS,
  DEFAULT_INTENSITY,
  DEFAULT_SIZE,
  DEFAULT_SPEED,
  SHADER_SOURCE,
} from './conf';
import { parseColor } from './helper';
import type { IEnergyOrb, RGB } from './types';

const source = Skia.RuntimeEffect.Make(SHADER_SOURCE);

function EnergyOrbComponent({
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  speed = DEFAULT_SPEED,
  intensity = DEFAULT_INTENSITY,
  colors = DEFAULT_COLORS,
  glowRadius = DEFAULT_GLOW_RADIUS,
}: IEnergyOrb) {
  const focused = useScreenFocused();
  const time = useSharedValue<number>(0);

  const frameCallback = useFrameCallback(() => {
    time.set(time.get() + 0.016 * speed);
  });

  useEffect(() => {
    frameCallback.setActive(focused);
  }, [focused, frameCallback]);

  const [c0r, c0g, c0b] = useMemo<RGB>(
    () => parseColor(colors[0] || DEFAULT_COLORS[0]),
    [colors],
  );
  const [c1r, c1g, c1b] = useMemo<RGB>(
    () => parseColor(colors[1] || colors[0] || DEFAULT_COLORS[1]),
    [colors],
  );
  const [c2r, c2g, c2b] = useMemo<RGB>(
    () => parseColor(colors[2] || colors[0] || DEFAULT_COLORS[2]),
    [colors],
  );

  const iResolution = useMemo<[number, number]>(
    () => [width, height],
    [width, height],
  );
  const uColor0 = useMemo<RGB>(() => [c0r, c0g, c0b], [c0r, c0g, c0b]);
  const uColor1 = useMemo<RGB>(() => [c1r, c1g, c1b], [c1r, c1g, c1b]);
  const uColor2 = useMemo<RGB>(() => [c2r, c2g, c2b], [c2r, c2g, c2b]);

  const uniforms = useDerivedValue<Uniforms>(() => ({
    iTime: time.value,
    iResolution,
    uSpeed: speed,
    uIntensity: intensity,
    uColor0,
    uColor1,
    uColor2,
    uGlowRadius: glowRadius,
  }));

  if (!source) return null;

  return (
    <Canvas style={[styles.canvas, { width, height }]}>
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: 'transparent',
  },
});

export const EnergyOrb = memo(EnergyOrbComponent);

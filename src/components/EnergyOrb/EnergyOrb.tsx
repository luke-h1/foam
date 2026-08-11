import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
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
import type { EnergyOrbProps, RGB } from './types';

let cachedShaderSource: ReturnType<typeof Skia.RuntimeEffect.Make> | null =
  null;

/**
 * Compiled on first orb mount instead of at module scope - the SkSL compile
 * plus Skia host-object init otherwise runs at import time on every launch.
 */
function getShaderSource() {
  cachedShaderSource ??= Skia.RuntimeEffect.Make(SHADER_SOURCE);
  return cachedShaderSource;
}

function EnergyOrbComponent({
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  speed = DEFAULT_SPEED,
  intensity = DEFAULT_INTENSITY,
  colors = DEFAULT_COLORS,
  glowRadius = DEFAULT_GLOW_RADIUS,
}: EnergyOrbProps) {
  const focused = useScreenFocused();
  const reduceMotion = useReducedMotion();
  const time = useSharedValue<number>(0);

  const frameCallback = useFrameCallback(frameInfo => {
    const deltaSeconds = (frameInfo.timeSincePreviousFrame ?? 16) / 1000;
    time.set(time.get() + deltaSeconds * speed);
  });

  /**
   * Under reduced motion the shader holds at a fixed time rather than being
   * removed: the orb still renders, it just stops moving.
   */
  useEffect(() => {
    frameCallback.setActive(focused && !reduceMotion);
  }, [focused, frameCallback, reduceMotion]);

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

  const source = getShaderSource();
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

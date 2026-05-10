import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
}

export function ProgressRing({
  progress,
  size = 44,
  strokeWidth = 3,
  trackColor = 'rgba(255, 255, 255, 0.15)',
  progressColor = 'rgba(255, 255, 255, 1)',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 400 });
  }, [animatedProgress, progress]);

  const backgroundPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(center, center, radius);
    return path;
  }, [center, radius]);

  const progressPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    path.addArc(
      {
        x: strokeWidth / 2,
        y: strokeWidth / 2,
        width: size - strokeWidth,
        height: size - strokeWidth,
      },
      -90,
      animatedProgress.value * 360,
    );

    return path;
  }, [animatedProgress, size, strokeWidth]);

  return (
    <Canvas style={{ height: size, width: size }}>
      <Path
        color={trackColor}
        path={backgroundPath}
        strokeCap="round"
        strokeWidth={strokeWidth}
        // eslint-disable-next-line react/style-prop-object
        style="stroke"
      />
      <Path
        color={progressColor}
        path={progressPath}
        strokeCap="round"
        strokeWidth={strokeWidth}
        // eslint-disable-next-line react/style-prop-object
        style="stroke"
      />
    </Canvas>
  );
}

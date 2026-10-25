import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { Canvas, Image } from '@shopify/react-native-skia';

import { useSharedPaintAnimationFrame } from './util/shared-paint-animation-frames';

interface PaintLayerStretchImageProps {
  imageUrl: string;
}

/**
 * Stretches one paint texture to the glyph box. The shared clock advances
 * an animated WebP. The compiler is off so a cached render cannot keep frame 0.
 */
export function PaintLayerStretchImage({
  imageUrl,
}: PaintLayerStretchImageProps) {
  'use no memo';

  const frame = useSharedPaintAnimationFrame(imageUrl);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setSize(current => {
      if (current.width === width && current.height === height) {
        return current;
      }

      return { width, height };
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {frame && size.width > 0 && size.height > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Image
            image={frame}
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fit='fill'
          />
        </Canvas>
      ) : null}
    </View>
  );
}

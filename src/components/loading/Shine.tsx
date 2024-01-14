// 2 seconds
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { SetStateAction, useEffect, useState } from 'react';
import { LayoutRectangle, StyleSheet } from 'react-native';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSporeColors } from '../../hooks/useSporeColors';
import { opacify } from '../../styles';
import { Flex } from '../Flex';

const SHIMMER_DURATION = 2000;

interface ShineProps {
  disabled?: boolean;
  children: JSX.Element;
}

export default function Shine({ children, disabled }: ShineProps) {
  const colors = useSporeColors();
  const [layout, setLayout] = useState<LayoutRectangle | null>();
  const xPosition = useSharedValue(0);

  useEffect(() => {
    xPosition.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION }),
      Infinity,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          xPosition.value,
          [0, 1],
          [layout ? -layout.width : 0],
        ),
      },
    ],
  }));

  if (!layout) {
    return (
      <Flex
        opacity={0}
        onLayout={(e: {
          nativeEvent: {
            layout: SetStateAction<LayoutRectangle | null | undefined>;
          };
        }) => setLayout(e.nativeEvent.layout)}
      >
        {children}
      </Flex>
    );
  }

  if (!disabled) {
    return (
      <MaskedView
        maskElement={children}
        style={{ width: layout.width, height: layout.height }}
      >
        <Flex
          grow
          backgroundColor="$neutral2"
          height="100%"
          overflow="hidden"
        />
        <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[
              opacify(0, colors.neutral2.val.slice(0, 7)),
              opacify(44, colors.surface2.val.slice(0, 7)),
              opacify(0, colors.neutral2.val.slice(0, 7)),
            ]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      </MaskedView>
    );
  }

  return children;
}

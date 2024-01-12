import React from 'react';
import { FlatList } from 'react-native';
import {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useDeviceDimensions } from '../../hooks/useDeviceDimensions';
import { AnimatedFlex, Flex } from '../Flex';

interface IndicatorProps {
  stepCount: number;
  currentStep: number;
}

export const Indicator = ({ currentStep, stepCount }: IndicatorProps) => {
  const { fullWidth } = useDeviceDimensions();
  const indicatorWidth = (200 / 375) * fullWidth;

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      justifyContent="space-evenly"
      width={indicatorWidth}
    >
      <FlatList
        data={Array.from({ length: stepCount })}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ index }) => {
          return (
            <Flex
              key={`indicator-${index}`}
              fill
              backgroundColor="$neutral1"
              borderRadius="$rounded16"
              height={4}
              opacity={index === currentStep ? 1 : 0.2}
            />
          );
        }}
      />
    </Flex>
  );
};

interface AnimatedIndicatorPillProps {
  index: number;
  scroll: SharedValue<number>;
}

const AnimatedIndicatorPill = ({
  index,
  scroll,
}: AnimatedIndicatorPillProps) => {
  const { fullWidth } = useDeviceDimensions();

  const style = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * fullWidth,
      index * fullWidth,
      (index + 1) * fullWidth,
    ];
    return {
      opacity: interpolate(
        scroll.value,
        inputRange,
        [0.2, 1, 0.2],
        Extrapolate.CLAMP,
      ),
    };
  });

  return (
    <AnimatedFlex
      key={`indicator-${index}`}
      fill
      backgroundColor="$neutral1"
      borderRadius="$rounded16"
      height={4}
      style={style}
    />
  );
};

interface AnimatedIndicatorProps {
  scroll: SharedValue<number>;
  stepCount: number;
}

export const AnimatedIndicator = ({
  scroll,
  stepCount,
}: AnimatedIndicatorProps) => {
  return (
    <Flex centered row gap="$spacing12" paddingHorizontal="$spacing24">
      <FlatList
        data={Array.from({ length: stepCount })}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ index }) => {
          return <AnimatedIndicatorPill index={index} scroll={scroll} />;
        }}
      />
    </Flex>
  );
};

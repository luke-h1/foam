/* eslint-disable no-shadow */
import { BoxProps } from '@shopify/restyle';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import LoadingSpinner from '../../assets/images/LoadingSpinner.png';
import { Theme } from '../styles/theme';
import Box from './Box';
import Image from './Image';

enum LoaderSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

interface LoaderProps extends BoxProps<Theme> {
  size?: LoaderSize;
}

const getCurrentLoaderSize = (size?: LoaderSize) => {
  switch (size) {
    case LoaderSize.Small:
      return 30;
    case LoaderSize.Medium:
      return 50;
    case LoaderSize.Large:
      return 80;
    default:
      return 50;
  }
};

const Loader = ({ size, ...props }: LoaderProps) => {
  const rotationDegree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotationDegree, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotationDegree]);

  return (
    <Box alignSelf="center" {...props}>
      <Animated.View
        style={{
          width: getCurrentLoaderSize(size),
          transform: [
            {
              rotateZ: rotationDegree.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      >
        <Image
          source={LoadingSpinner}
          width={getCurrentLoaderSize(size)}
          height={getCurrentLoaderSize(size)}
        />
      </Animated.View>
    </Box>
  );
};

export default Loader;

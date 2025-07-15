/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: ViewStyle;
  source: string;
}

export const Image = memo(function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 50,
  source,
  ...props
}: ImageProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={source}
        contentFit={contentFit}
        transition={transition}
        cachePolicy="disk"
        decodeFormat="rgb"
        recyclingKey={source}
        placeholderContentFit={placeholderContentFit ?? 'scale-down'}
        onError={error => {
          console.warn('Image loading error:', error);
        }}
      />
    </View>
  );
});

const stylesheet = createStyleSheet(() => ({
  container: {
    position: 'relative',
  },
}));

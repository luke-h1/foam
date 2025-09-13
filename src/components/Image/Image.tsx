/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { View, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface ImageProps extends ExpoImageProps {
  containerStyle?: ViewStyle;
}

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  ...props
}: ImageProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={source}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat="rgb"
        useAppleWebpCodec
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onError={error => {
          console.warn('Image loading error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    position: 'relative',
  },
}));

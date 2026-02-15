/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { View, ViewStyle, StyleProp } from 'react-native';
import { NitroImage } from 'react-native-nitro-image';
import { StyleSheet } from 'react-native-unistyles';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: ViewStyle;
  /**
   * Use NitroImage for faster rendering (direct native bindings)
   * Best for chat emotes and high-volume image lists
   */
  useNitro?: boolean;
  source?: string | { uri: string } | number;
}

/**
 * Extract URL from various source formats
 */
function getSourceUrl(source: ImageProps['source']): string | null {
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && 'uri' in source) return source.uri;
  return null;
}

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  useNitro = true,
  style,
  ...props
}: ImageProps) {
  const url = getSourceUrl(source);

  if (useNitro && url) {
    const resizeMode = ((): 'cover' | 'contain' | 'stretch' => {
      if (contentFit === 'cover') {
        return 'cover';
      }
      if (contentFit === 'contain') {
        return 'contain';
      }
      if (contentFit === 'fill') {
        return 'stretch';
      }
      return 'cover';
    })();

    return (
      <View style={[styles.container, containerStyle]}>
        <NitroImage
          image={{ url }}
          style={style as StyleProp<ViewStyle>}
          resizeMode={resizeMode}
          recyclingKey={url}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={source}
        style={style}
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

// eslint-disable-next-line no-restricted-imports
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { View, ViewStyle } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: ViewStyle;
  source: string;
}
export function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition,
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
        transition={transition ?? 500}
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onError={error => {
          console.warn('Image loading error:', error);
        }}
      />
    </View>
  );
}

const stylesheet = createStyleSheet(() => ({
  container: {
    position: 'relative',
  },
}));

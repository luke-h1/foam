import { theme } from '@app/styles/themes';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Image } from '../Image/Image';

interface Props {
  thumbnail?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  animated?: boolean;
}

export function LiveStreamImage({ animated, size, style, thumbnail }: Props) {
  return (
    <View style={[styles.imageContainer, style]}>
      {thumbnail ? (
        <Image
          testID="LiveStreamImage-image"
          contentFit="contain"
          source={thumbnail
            .replace('{width}', '2560')
            .replace('{height}', '1080')}
          style={[styles.image, size && getImageSizeStyle(size)]}
          transition={animated ? 300 : 0}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {},
  imageContainer: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
});

function getImageSizeStyle(size: NonNullable<Props['size']>) {
  switch (size) {
    case 'lg':
      return { height: 100, width: 130 };
    case 'md':
      return { height: 60, width: 60 };
    case 'sm':
      return { height: 55, width: 55 };
    case 'xl':
      return { height: 200, width: 200 };
    default:
      return {};
  }
}

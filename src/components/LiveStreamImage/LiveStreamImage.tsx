import { View, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from '../Image';

interface Props {
  thumbnail?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  animated?: boolean;
}

export function LiveStreamImage({ animated, size, style, thumbnail }: Props) {
  styles.useVariants({
    size,
  });

  return (
    <View style={[styles.imageContainer, style]}>
      {thumbnail ? (
        <Image
          testID="LiveStreamImage-image"
          contentFit="contain"
          source={thumbnail
            .replace('{width}', '2560')
            .replace('{height}', '1080')}
          style={styles.image}
          transition={animated ? 300 : 0}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  imageContainer: {
    marginRight: theme.spacing.md,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 70,
  },
  image: {
    variants: {
      size: {
        sm: { width: 55, height: 55 },
        md: { width: 60, height: 60 },
        lg: { width: 130, height: 100 },
        xl: { width: 200, height: 200 },
      },
    },
  },
  logo: {
    variants: {
      size: {
        sm: { width: 20, height: 20 },
        md: { width: 30, height: 30 },
        lg: { width: 50, height: 50 },
        xl: { width: 100, height: 100 },
      },
    },
  },
  fallback: {
    backgroundColor: theme.colors.accent.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

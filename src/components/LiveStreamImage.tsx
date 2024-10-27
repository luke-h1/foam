/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
import theme from '@app/styles/theme';
import { Image } from 'expo-image';
import {
  ImageStyle,
  StyleSheet,
  View,
  ViewStyle,
  Text,
  TextStyle,
} from 'react-native';
import elapsedStreamTime from '../utils/elapsedStreamTime';

interface Props {
  thumbnail?: string;
  size?: 'medium' | 'large' | 'xlarge' | 'small';
  style?: ViewStyle;
  startedAt: string;
  animated?: boolean;
}

export default function LiveStreamImage({
  animated,
  size,
  style,
  thumbnail,
  startedAt,
}: Props) {
  const imageSize = (() => {
    switch (size) {
      case 'small':
        return styles.imageSizeSmall;

      case 'large':
        return styles.imageSizeLarge;
      case 'xlarge':
        return styles.imageSizeExtraLarge;
      case 'medium':
      default:
        return styles.imageSizeMedium;
    }
  })();

  const imageStyles = [styles.profileImage, imageSize];

  const logoSize = (() => {
    switch (size) {
      case 'small':
        return styles.logoSizeSmall;
      case 'large':
        return styles.logoSizeLarge;
      case 'xlarge':
        return styles.logoSizeExtraLarge;
      case 'medium':
      default:
        return styles.logoSizeMedium;
    }
  })();

  const placeholder = (
    <View style={[imageStyles, styles.fallbackImage]}>
      <Image
        source={require('../../assets/foam.png')}
        style={logoSize}
        testID="LiveStreamImage-placeholder"
      />
    </View>
  );

  return (
    <View style={[imageSize, styles.imageContainer, style]}>
      {thumbnail ? (
        <Image
          testID="LiveStreamImage-image"
          source={{
            uri: thumbnail
              .replace('{width}', '2560')
              .replace('{height}', '1080'),
          }}
          style={imageStyles}
          transition={animated ? 300 : 0}
        />
      ) : (
        placeholder
      )}
      {startedAt && (
        <View style={styles.elapsedTimeContainer}>
          <Text style={styles.elapsedTimeText}>
            {elapsedStreamTime(startedAt)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create<{
  fallbackImage: ViewStyle;
  imageContainer: ViewStyle;
  imageSizeLarge: ImageStyle;
  imageSizeExtraLarge: ImageStyle;
  imageSizeMedium: ImageStyle;
  imageSizeSmall: ImageStyle;
  logoSizeLarge: ImageStyle;
  logoSizeExtraLarge: ImageStyle;
  logoSizeMedium: ImageStyle;
  logoSizeSmall: ImageStyle;
  profileImage: ImageStyle;
  elapsedTimeContainer: ViewStyle;
  elapsedTimeText: TextStyle;
}>({
  imageContainer: {
    marginRight: theme.spacing.md,
    borderRadius: theme.borderradii.sm,
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 70,
    ...StyleSheet.absoluteFillObject,
  },
  imageSizeSmall: {
    width: 55,
    height: 55,
  },
  imageSizeMedium: {
    width: 60,
    height: 60,
  },
  imageSizeLarge: {
    width: 130,
    height: 100,
  },
  imageSizeExtraLarge: {
    width: 200,
    height: 200,
  },
  fallbackImage: {
    backgroundColor: theme.color.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSizeSmall: {
    width: 20,
    height: 20,
  },
  logoSizeMedium: {
    width: 30,
    height: 30,
  },
  logoSizeExtraLarge: {
    width: 100,
    height: 100,
  },
  logoSizeLarge: {
    width: 50,
    height: 50,
  },
  elapsedTimeContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
    paddingVertical: 2,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elapsedTimeText: {
    color: 'white',
    fontSize: 12,
  },
});

import { colors, spacing } from '@app/styles';
import { radii } from '@app/styles/radii';
import { Image } from 'expo-image';
import { View, ViewStyle, ImageStyle } from 'react-native';

interface Props {
  thumbnail?: string;
  size?: 'medium' | 'large' | 'xlarge' | 'small';
  style?: ViewStyle;
  animated?: boolean;
}

export default function LiveStreamImage({
  animated,
  size,
  style,
  thumbnail,
}: Props) {
  const imageSize = (() => {
    switch (size) {
      case 'small':
        return $imageSizeSmall;

      case 'large':
        return $imageSizeLarge;

      case 'xlarge':
        return $imageSizeExtraLarge;

      case 'medium':
      default:
        return $imageSizeMedium;
    }
  })();

  const logoSize = (() => {
    switch (size) {
      case 'small':
        return $logoSizeSmall;
      case 'large':
        return $logoSizeLarge;
      case 'xlarge':
        return $logoSizeExtraLarge;
      case 'medium':
      default:
        return $logoSizeMedium;
    }
  })();

  const imageStyles = [$profileImage, imageSize];

  const placeholder = (
    <View style={[imageStyles, $fallbackImage]}>
      <Image
        // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
        source={require('../../assets/foam.png')}
        style={logoSize as ImageStyle}
        testID="LiveStreamImage-placeholder"
      />
    </View>
  );

  return (
    <View style={[imageSize, $imageContainer, style]}>
      {thumbnail ? (
        <Image
          testID="LiveStreamImage-image"
          source={{
            uri: thumbnail
              .replace('{width}', '2560')
              .replace('{height}', '1080'),
          }}
          style={imageStyles as ImageStyle[]}
          transition={animated ? 300 : 0}
        />
      ) : (
        placeholder
      )}
    </View>
  );
}

const $imageContainer: ViewStyle = {
  marginRight: spacing.medium,
  borderRadius: radii.sm,
  overflow: 'hidden',
};

const $profileImage: ViewStyle = {
  width: 50,
  height: 70,
};

const $imageSizeSmall: ViewStyle = {
  width: 55,
  height: 55,
};

const $imageSizeMedium: ViewStyle = {
  width: 60,
  height: 60,
};

const $imageSizeLarge: ViewStyle = {
  width: 130,
  height: 100,
};

const $imageSizeExtraLarge: ViewStyle = {
  width: 200,
  height: 200,
};

const $fallbackImage: ViewStyle = {
  backgroundColor: colors.border,
  justifyContent: 'center',
  alignItems: 'center',
};

const $logoSizeSmall: ViewStyle = {
  width: 20,
  height: 20,
};

const $logoSizeMedium: ViewStyle = {
  width: 30,
  height: 30,
};

const $logoSizeExtraLarge: ViewStyle = {
  width: 100,
  height: 100,
};

const $logoSizeLarge: ViewStyle = {
  width: 50,
  height: 50,
};

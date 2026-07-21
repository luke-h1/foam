import { memo } from 'react';
import { ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@app/styles/themes';

import { Image } from '../Image/Image';

interface Props {
  thumbnail?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  animated?: boolean;
}

export const LIVE_STREAM_IMAGE_SM_WIDTH = 55;

export const LiveStreamImage = memo(function LiveStreamImage({
  animated,
  size,
  style,
  thumbnail,
}: Props) {
  const { width, height } = getThumbnailRequestSize(size);

  return (
    <View style={[styles.imageContainer, style]}>
      {thumbnail ? (
        <Image
          testID='LiveStreamImage-image'
          contentFit='contain'
          source={thumbnail
            .replace('{width}', width)
            .replace('{height}', height)}
          style={[styles.image, size && getImageSizeStyle(size)]}
          transition={animated ? 300 : 0}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  image: {},
  imageContainer: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    overflow: 'hidden',
  },
});

/**
 * Twitch preview URLs are `{width}x{height}` templates, so request a 16:9
 * variant close to the rendered size (~3x the largest display width for
 * high-density screens) instead of a full 2560x1080 frame for a small
 * thumbnail.
 */
function getThumbnailRequestSize(size?: Props['size']): {
  width: string;
  height: string;
} {
  switch (size) {
    case 'sm':
      return { width: '160', height: '90' };
    case 'md':
      return { width: '200', height: '112' };
    case 'lg':
      return { width: '480', height: '270' };
    case 'xl':
    default:
      return { width: '640', height: '360' };
  }
}

function getImageSizeStyle(size: NonNullable<Props['size']>): ImageStyle {
  switch (size) {
    case 'lg':
      return { height: 100, width: 130 };
    case 'md':
      return { height: 60, width: 60 };
    case 'sm':
      return { height: 55, width: LIVE_STREAM_IMAGE_SM_WIDTH };
    case 'xl':
      return { height: 200, width: 200 };
    default:
      return {};
  }
}

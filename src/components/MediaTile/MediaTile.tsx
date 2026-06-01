import { Image } from '@app/components/Image/Image';
import { DEFAULT_BLURHASH } from '@app/components/ImageZoomView/constants';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import {
  Dimensions,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

interface MediaTileProps {
  source: string | { uri: string } | number;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  showOverlay?: boolean;
  imageStyle?: StyleProp<ImageStyle>;
}

const IMAGE_WIDTH = Dimensions.get('window').width / 2 - 16;

export function MediaTile({
  source,
  title,
  subtitle,
  onPress,
  showOverlay = true,
  imageStyle,
}: MediaTileProps) {
  const flattenedImageStyle = StyleSheet.flatten([
    {
      width: IMAGE_WIDTH,
      height: 280,
      borderRadius: 16,
    },
    imageStyle,
  ]);

  return (
    <PressableArea onPress={onPress} style={styles.container}>
      <Image
        cachePolicy='memory-disk'
        contentFit='cover'
        placeholder={DEFAULT_BLURHASH}
        source={source}
        style={flattenedImageStyle}
        transition={1000}
      />
      {showOverlay ? (
        <View style={styles.overlay}>
          {title ? (
            <Text numberOfLines={1} type='sm' weight='bold'>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle} type='xs'>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </PressableArea>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
    borderCurve: 'continuous',
    gap: 6,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    alignItems: 'flex-start',
    bottom: 0,
    display: 'flex',
    experimental_backgroundImage:
      'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 1))',
    flexDirection: 'column',
    height: '50%',
    justifyContent: 'flex-end',
    left: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    position: 'absolute',
    width: '100%',
    zIndex: 2,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: 'center',
    width: '100%',
  },
});

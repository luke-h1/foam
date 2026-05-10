import { Image } from '@app/components/Image/Image';
import LinearGradient from '@app/components/ui/LinearGradient/LinearGradient';
import { BlurView } from 'expo-blur';
import {
  StyleSheet,
  View,
  useColorScheme,
  type ColorValue,
  type DimensionValue,
} from 'react-native';

type GradientTuple =
  | readonly [ColorValue, ColorValue, ColorValue]
  | readonly [ColorValue, ColorValue, ColorValue, ColorValue]
  | readonly [ColorValue, ColorValue, ColorValue, ColorValue, ColorValue];

export interface LinearGradientImageBlurProps {
  showBlur?: boolean;
  showImage?: boolean;
  showGradient?: boolean;
  gradientColors?: {
    light: GradientTuple;
    dark: GradientTuple;
  };
  imageUrl?: string;
  blurIntensity?: number;
  solidColor?: string;
  imageHeight?: DimensionValue;
}

export default function ImageBackdrop({
  showBlur = true,
  showImage = true,
  showGradient = true,
  gradientColors = {
    light: [
      'transparent',
      'rgba(245, 248, 255, 0.5)',
      'rgba(245, 248, 255, 1)',
    ],
    dark: ['transparent', 'rgba(9, 9, 11, 0.5)', 'rgba(9, 9, 11, 1)'],
  },
  imageUrl,
  blurIntensity = 30,
  solidColor,
  imageHeight = '100%',
}: LinearGradientImageBlurProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const selectedColors = isDarkMode
    ? gradientColors.dark
    : gradientColors.light;

  return (
    <View style={styles.container}>
      {showBlur ? (
        <View style={styles.blurView}>
          <BlurView intensity={blurIntensity} style={styles.blurFill} />
        </View>
      ) : null}

      {showGradient ? (
        <View style={styles.gradientContainer}>
          <LinearGradient colors={selectedColors} />
        </View>
      ) : null}

      {showImage && imageUrl ? (
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image
            contentFit="cover"
            contentPosition="top"
            source={imageUrl}
            style={styles.image}
          />
        </View>
      ) : null}

      {solidColor ? (
        <View
          style={[styles.solidColorContainer, { backgroundColor: solidColor }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blurFill: {
    flex: 1,
  },
  blurView: {
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 3,
  },
  container: {
    flex: 1,
    height: '100%',
    position: 'relative',
    width: '100%',
  },
  gradientContainer: {
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 2,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  solidColorContainer: {
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 0,
  },
});

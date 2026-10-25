import { StyleSheet, View, type ViewStyle } from 'react-native';

interface PaintLayerStretchImageProps {
  imageUrl: string;
}

type WebBackgroundStyle = ViewStyle & {
  backgroundImage: string;
  backgroundRepeat: string;
  backgroundSize: string;
};

/**
 * Web build: the browser stretches the texture and plays an animated WebP
 * used as a CSS background.
 */
export function PaintLayerStretchImage({
  imageUrl,
}: PaintLayerStretchImageProps) {
  const webBackgroundStyle: WebBackgroundStyle = {
    backgroundImage: `url("${imageUrl.replaceAll('"', '%22')}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  };

  return <View style={[StyleSheet.absoluteFill, webBackgroundStyle]} />;
}

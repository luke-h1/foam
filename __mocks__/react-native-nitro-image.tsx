import { View } from 'react-native';

export const NitroImage = ({
  style,
  ...props
}: {
  style?: object;
  [key: string]: unknown;
}) => <View style={style} testID="nitro-image" {...props} />;

export const useImage = () => ({ image: null, error: null });
export const useImageLoader = () => null;
export const loadImage = () => Promise.resolve(null);

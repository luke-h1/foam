import { StyleSheet, View } from 'react-native';

import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

interface AvatarProps {
  uri: string | undefined;
  name: string;
  size: number;
}

/**
 * A round profile image. Without an image it shows the first letter of the
 * name on a plain fill.
 */
export function Avatar({ uri, name, size }: AvatarProps) {
  const sizeStyle = { height: size, width: size };

  if (uri) {
    return (
      <Image
        source={uri}
        cacheVariant='avatar'
        transition={150}
        style={[styles.avatar, sizeStyle]}
        containerStyle={[styles.avatar, sizeStyle]}
      />
    );
  }

  return (
    <View style={[styles.avatar, styles.fallback, sizeStyle]}>
      <Text type='headline'>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: theme.color.surfaceElevated.dark,
    justifyContent: 'center',
  },
});

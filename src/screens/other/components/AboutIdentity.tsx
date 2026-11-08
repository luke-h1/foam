import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Image } from '@app/components/image/Image';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

const appIconProduction = require('../../../../assets/app-icon/app-icon-production.png');

interface AboutIdentityProps {
  style?: StyleProp<ViewStyle>;
}

export function AboutIdentity({ style }: AboutIdentityProps) {
  return (
    <View style={[styles.row, style]}>
      <Image source={appIconProduction} style={styles.appIcon} />
      <View style={styles.text}>
        <Text type='title3' weight='bold' numberOfLines={1}>
          Foam
        </Text>
        <Text type='subhead' color='gray.textLow' numberOfLines={2}>
          A Twitch client built for your phone.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    height: 56,
    width: 56,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    padding: theme.space16,
  },
  text: {
    flex: 1,
    gap: theme.space4,
  },
});

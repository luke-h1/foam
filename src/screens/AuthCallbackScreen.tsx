import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <Text type='lg' color='gray'>
        Completing sign in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    flex: 1,
    justifyContent: 'center',
  },
});

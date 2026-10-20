import { StyleSheet, View } from 'react-native';

import { LoadingState } from '@app/components/loading-state/loading-state';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

export function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <LoadingState style={styles.spinner} />
      <Text type='headline' color='gray' align='center'>
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
  spinner: {
    flex: 0,
    marginBottom: theme.space8,
  },
});

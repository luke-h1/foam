import { Text } from '@app/components/Text/Text';
import { View, StyleSheet } from 'react-native';

/**
 * Shown when the app is opened via the Twitch OAuth redirect (e.g. foam://auth#access_token=...).
 * The actual token handling and navigation are done in the Linking listener in AppNavigator;
 * this screen may show briefly until the app resets to Tabs.
 */
export function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <Text type="lg" color="gray">
        Completing sign in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
});

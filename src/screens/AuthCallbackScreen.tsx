import { Text } from '@app/components/ui/Text/Text';
import { View, StyleSheet } from 'react-native';

/**
 * Shown when the app is opened via the Twitch OAuth redirect.
 * The actual token handling and navigation are done in the root router layout.
 * This screen may show briefly until the app redirects to the main tab flow.
 */
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
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
});

import { StyleSheet, useColorScheme, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

/**
 * Shown when the app is opened via the Twitch OAuth redirect.
 * The actual token handling and navigation are done in the root router layout.
 * This screen may show briefly until the app redirects to the main tab flow.
 */
export function AuthCallbackScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <Text type='lg' color='gray'>
        Completing sign in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

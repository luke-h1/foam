import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

export function StorybookScreen() {
  return (
    <View style={styles.container}>
      <Text type='title3' weight='semibold' align='center'>
        Storybook is available in the native development app.
      </Text>
      <Text type='body' color='gray' align='center' style={styles.description}>
        The web app uses the normal Expo Router screens so the root route can
        load without bundling the native Storybook runtime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  description: {
    maxWidth: 420,
  },
});

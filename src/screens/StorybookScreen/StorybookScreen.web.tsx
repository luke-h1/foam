import { StyleSheet, useColorScheme, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export function StorybookScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <Text type='lg' weight='semibold' align='center'>
        Storybook is available in the native development app.
      </Text>
      <Text type='sm' color='gray' align='center' style={styles.description}>
        The web app uses the normal Expo Router screens so the root route can
        load without bundling the native Storybook runtime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  description: {
    maxWidth: 420,
  },
});

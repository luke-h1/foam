import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';

export function StorybookScreen() {
  return (
    <View style={styles.container}>
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

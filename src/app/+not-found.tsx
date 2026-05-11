import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text type="title" color="gray" align="center" style={styles.title}>
          This screen does not exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text type="link" color="blue" align="center">
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space36,
  },
  link: {
    marginTop: theme.space16,
    paddingVertical: theme.space16,
  },
  title: {
    marginBottom: theme.space16,
    textAlign: 'center',
  },
});

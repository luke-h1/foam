import theme from '@app/styles/theme';
import * as Application from 'expo-application';
import { useUpdates } from 'expo-updates';
import { StyleSheet, View, ViewStyle } from 'react-native';
import pkg from '../../package.json';
import Text from './Text';

export default function BuildDetails() {
  const updates = useUpdates();

  const updatedId = updates?.currentlyRunning?.updateId;

  return (
    <View style={styles.container}>
      <Text size="xxs">v{Application.nativeApplicationVersion}</Text>
      <Text size="xxs">({Application.nativeBuildVersion})</Text>
      <Text size="xxs">pkg:{pkg.version}</Text>
      {updatedId ? (
        <Text size="xxs" style={{ color: theme.color.grey }}>
          {updatedId}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
}>({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});

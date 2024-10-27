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
      <Text fontSize={12}>v{Application.nativeApplicationVersion}</Text>
      <Text fontSize={12}>({Application.nativeBuildVersion})</Text>
      <Text fontSize={12}>pkg:{pkg.version}</Text>
      {updatedId ? (
        <Text fontSize={12} style={{ color: theme.color.grey }}>
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

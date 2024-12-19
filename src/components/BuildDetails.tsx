import { colors, spacing } from '@app/styles';
import * as Application from 'expo-application';
import { useUpdates } from 'expo-updates';
import { StyleSheet, View, ViewStyle } from 'react-native';
import pkg from '../../package.json';
import { Text } from './ui/Text';

export default function BuildDetails() {
  const updates = useUpdates();

  const updatedId = updates?.currentlyRunning?.updateId;

  return (
    <View style={styles.container}>
      <Text>v{Application.nativeApplicationVersion}</Text>
      <Text>({Application.nativeBuildVersion})</Text>
      <Text>pkg:{pkg.version}</Text>
      {updatedId ? <Text>{updatedId}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
}>({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.medium,
    paddingBottom: spacing.small,
  },
});

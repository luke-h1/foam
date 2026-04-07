import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { Diagnostics } from './components/Diagnostics';

export function DiagnosticsScreen() {
  return (
    <View style={styles.container}>
      <Diagnostics />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
});

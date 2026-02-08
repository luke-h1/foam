import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Diagnostics } from './components/Diagnostics';

export function DiagnosticsScreen() {
  return (
    <View style={styles.container}>
      <Diagnostics />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
}));

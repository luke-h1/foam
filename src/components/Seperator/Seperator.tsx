import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function Seperator() {
  return <View style={styles.seperator} />;
}

const styles = StyleSheet.create(theme => ({
  seperator: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.black.bgAlpha,
    marginTop: theme.spacing.sm,
    borderCurve: 'continuous',
  },
}));

import { ActivityIndicator, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export function AppLoading() {
  const { styles } = useStyles(stylesheet);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.screen,
  },
}));

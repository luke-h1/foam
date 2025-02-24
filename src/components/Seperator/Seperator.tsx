import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export function Seperator() {
  const { styles } = useStyles(stylesheet);
  return <View style={styles.seperator} />;
}

const stylesheet = createStyleSheet(theme => ({
  seperator: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
    marginTop: theme.spacing.sm,
  },
}));

import * as Application from 'expo-application';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Typography } from '../Typography';

export function BuildDetails() {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Typography testID="BuildDetails-nativeAppVersion">
        v{Application.nativeApplicationVersion ?? 'unknown'}
      </Typography>
      <Typography testID="BuildDetails-nativeBuildVersion">
        Native build version: {Application.nativeBuildVersion ?? ''}
      </Typography>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
}));

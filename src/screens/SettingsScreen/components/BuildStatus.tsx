import { Typography } from '@app/components/Typography';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function BuildStatus() {
  return (
    <View style={styles.buildContainer}>
      <Typography size="xs" color="gray.border">
        v:{Application.nativeApplicationVersion ?? ''} (
        {Application.nativeBuildVersion ?? ''}) • OTA:{' '}
        {Updates.updateId ?? 'Embedded'}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  buildContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
}));

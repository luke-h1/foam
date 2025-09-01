import { Typography } from '@app/components/Typography';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function BuildStatus() {
  return (
    <View style={styles.buildContainer}>
      <Typography size="xs" color="gray.accent">
        v:{Application.nativeApplicationVersion ?? ''} (
        {Application.nativeBuildVersion ?? ''})
      </Typography>
      <Typography size="xs" color="gray.accent">
        OTA: {Updates.runtimeVersion} (
        {(Updates.createdAt ?? new Date()).toLocaleString('en-US', {
          timeZoneName: 'short',
        })}
        )
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  buildContainer: {
    borderTopColor: theme.colors.gray.accent,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
}));

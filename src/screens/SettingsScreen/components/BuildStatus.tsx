import { Text } from '@app/components/Text';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function BuildStatus() {
  return (
    <View style={styles.buildContainer}>
      <Text type="xs" color="gray.border">
        v:{Application.nativeApplicationVersion ?? ''} (
        {Application.nativeBuildVersion ?? ''}) • OTA:{' '}
        {Updates.updateId ?? 'Embedded'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  buildContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
}));

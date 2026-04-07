import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { View, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  buildContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
});

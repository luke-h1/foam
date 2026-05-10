import { ProgressRing } from '@app/components/ProgressRing/ProgressRing';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { View, StyleSheet } from 'react-native';

export function BuildStatus() {
  const updateProgress = Updates.updateId ? 1 : 0.72;

  return (
    <View style={styles.buildContainer}>
      <ProgressRing
        progress={updateProgress}
        size={28}
        strokeWidth={3}
        trackColor={theme.darkActiveContent}
        progressColor={theme.colorDarkGreen}
      />
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
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
});

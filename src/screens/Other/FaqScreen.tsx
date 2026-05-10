import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FaqScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="FAQ" subtitle="Common questions" size="medium" />
      <View style={styles.card}>
        <Text weight="semibold">The support FAQ is still being rewritten.</Text>
        <Text type="sm" color="gray.textLow" style={styles.copy}>
          This screen now uses the redesigned shell, but the actual help content
          still needs a proper authored pass.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    marginHorizontal: theme.space20,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  copy: {
    marginTop: theme.space12,
  },
});

import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LicensesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Licenses"
        subtitle="Open-source software used by Foam"
        size="medium"
      />
      <View style={styles.card}>
        <Text weight="semibold">Open-source acknowledgements</Text>
        <Text type="sm" color="gray.textLow" style={styles.copy}>
          The native license list is available in the iOS and Android apps.
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

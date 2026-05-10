import { Button } from '@app/components/Button/Button';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';
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
          Launch the native license list to inspect bundled dependencies and
          attribution details.
        </Text>
        <Button
          onPress={() =>
            ReactNativeLegal.launchLicenseListScreen('OSS licenses')
          }
          style={styles.cta}
        >
          <Text weight="semibold">Open license list</Text>
        </Button>
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
  cta: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    marginTop: theme.space20,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space16,
  },
});

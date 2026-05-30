import { Button } from '@app/components/Button/Button';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { Platform, StyleSheet } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtherInfoCard } from './components/OtherInfoCard';

export function LicensesScreen() {
  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'ios' ? [] : ['top']}
    >
      {Platform.OS === 'ios' ? null : (
        <ScreenHeader
          title="Licenses"
          subtitle="Open-source software used by Foam"
          size="medium"
        />
      )}
      <OtherInfoCard
        title="Open-source acknowledgements"
        body="Launch the native license list to inspect bundled dependencies and attribution details."
      >
        <Button
          onPress={() =>
            ReactNativeLegal.launchLicenseListScreen('OSS licenses')
          }
          style={styles.cta}
        >
          <Text weight="semibold">Open license list</Text>
        </Button>
      </OtherInfoCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
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

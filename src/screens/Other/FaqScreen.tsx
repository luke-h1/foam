import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtherInfoCard } from './components/OtherInfoCard';

export function FaqScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="FAQ" subtitle="Common questions" size="medium" />
      <OtherInfoCard
        title="The support FAQ is still being rewritten."
        body="This screen now uses the redesigned shell, but the actual help content still needs a proper authored pass."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});

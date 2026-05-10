import {
  EmptyLayout,
  EmptyLayoutContent,
  EmptyLayoutDescription,
  EmptyLayoutHeader,
  EmptyLayoutTitle,
} from '@app/components/EmptyLayout/EmptyLayout';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

export function ThemePreferenceScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Theme"
        subtitle="Current visual mode"
        size="medium"
      />
      <EmptyLayout variant="outline" style={styles.empty}>
        <EmptyLayoutHeader>
          <EmptyLayoutTitle>Foam Dark</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            The redesign now runs on a single cinematic theme instead of
            splitting effort across legacy variants.
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <Text type="sm" color="gray.textLow">
            Additional themes can be added later on top of the new token system.
          </Text>
        </EmptyLayoutContent>
      </EmptyLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  empty: {
    marginHorizontal: theme.space20,
    minHeight: 320,
  },
});

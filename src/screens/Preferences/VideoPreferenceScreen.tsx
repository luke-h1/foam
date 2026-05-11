import {
  EmptyLayout,
  EmptyLayoutContent,
  EmptyLayoutDescription,
  EmptyLayoutHeader,
  EmptyLayoutTitle,
} from '@app/components/EmptyLayout/EmptyLayout';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

export function VideoPreferenceScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Video"
        subtitle="Playback controls and stream quality"
        size="medium"
      />
      <EmptyLayout variant="outline" style={styles.empty}>
        <EmptyLayoutHeader>
          <EmptyLayoutTitle>Video controls are next</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            This screen is now on the new system, but stream-quality and player
            preferences still need a dedicated implementation pass.
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <Text type="sm" color="gray.textLow">
            The shell is in place so the remaining controls can be added without
            dragging old UI forward.
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

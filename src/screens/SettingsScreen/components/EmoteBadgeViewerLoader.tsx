import { ActivityIndicator, Platform, useColorScheme } from 'react-native';

import { Host, ProgressView } from '@expo/ui/swift-ui';
import { controlSize, tint } from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (Platform.OS === 'ios') {
    return (
      <Host matchContents>
        <ProgressView
          modifiers={[controlSize('large'), tint(theme.color.accent[scheme])]}
        />
      </Host>
    );
  }
  return <ActivityIndicator size='large' color={theme.color.accent[scheme]} />;
}

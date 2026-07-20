import { ActivityIndicator, Platform } from 'react-native';

import { Host, ProgressView } from '@expo/ui/swift-ui';
import { controlSize, tint } from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  if (Platform.OS === 'ios') {
    return (
      <Host matchContents>
        <ProgressView
          modifiers={[controlSize('large'), tint(theme.colorPrimary)]}
        />
      </Host>
    );
  }
  return <ActivityIndicator size='large' color={theme.colorPrimary} />;
}

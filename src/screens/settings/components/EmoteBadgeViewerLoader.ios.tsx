import { Host, ProgressView } from '@expo/ui/swift-ui';
import { controlSize, tint } from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  return (
    <Host matchContents>
      <ProgressView
        modifiers={[controlSize('large'), tint(theme.colorPrimary)]}
      />
    </Host>
  );
}

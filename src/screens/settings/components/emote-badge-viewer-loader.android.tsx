import { CircularProgressIndicator, Host } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  return (
    <Host matchContents>
      <CircularProgressIndicator color={theme.colorPrimary} />
    </Host>
  );
}

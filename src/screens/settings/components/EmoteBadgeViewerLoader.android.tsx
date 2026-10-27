import { CircularProgressIndicator } from '@expo/ui/jetpack-compose';

import { FoamComposeHost } from '@app/components/compose-host/FoamComposeHost';
import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  return (
    <FoamComposeHost matchContents>
      <CircularProgressIndicator color={theme.colorPrimary} />
    </FoamComposeHost>
  );
}

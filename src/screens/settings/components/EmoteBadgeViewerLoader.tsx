import { ActivityIndicator } from 'react-native';

import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  return <ActivityIndicator size='large' color={theme.colorPrimary} />;
}

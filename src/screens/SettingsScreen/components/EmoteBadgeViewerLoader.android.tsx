import { useColorScheme } from 'react-native';

import { CircularProgressIndicator, Host } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

export function EmoteBadgeViewerLoader() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Host matchContents>
      <CircularProgressIndicator color={theme.color.accent[scheme]} />
    </Host>
  );
}

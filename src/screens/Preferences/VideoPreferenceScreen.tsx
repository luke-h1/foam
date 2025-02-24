import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function VideoPreferenceScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Video Preferences',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  return (
    <Screen>
      <Typography>Video preferences</Typography>
    </Screen>
  );
}

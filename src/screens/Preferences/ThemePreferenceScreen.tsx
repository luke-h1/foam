import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function ThemePreferenceScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Theme preferences',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  return (
    <Screen>
      <Typography>Theme preferences</Typography>
    </Screen>
  );
}

import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function AboutScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'About',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });
  return (
    <Screen>
      <Typography>About</Typography>
    </Screen>
  );
}

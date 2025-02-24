import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function DiagnosticsScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Diagnostics',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  return (
    <Screen>
      <Typography>Diagnostics</Typography>
    </Screen>
  );
}

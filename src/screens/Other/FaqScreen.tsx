import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function FaqScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Faq',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });
  return (
    <Screen>
      <Typography>FAQ</Typography>
    </Screen>
  );
}

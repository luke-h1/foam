import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function BlockedUsersScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Blocked Users',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  return (
    <Screen>
      <Typography>Blocked users</Typography>
    </Screen>
  );
}

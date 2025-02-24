import { Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';

export function ChatPreferenceScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Chat Preferences',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });
  return (
    <Screen>
      <Typography>Chat preferences</Typography>
    </Screen>
  );
}

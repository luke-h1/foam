import { Screen } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';
import { Diagnostics } from './components';

export function DiagnosticsScreen() {
  const { goBack } = useAppNavigation();

  useHeader({
    title: 'Diagnostics',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  return (
    <Screen preset="scroll">
      <Diagnostics />
    </Screen>
  );
}

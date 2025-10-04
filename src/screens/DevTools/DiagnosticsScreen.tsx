import { Screen } from '@app/components/Screen';
import { Diagnostics } from './components';

export function DiagnosticsScreen() {
  return (
    <Screen safeAreaEdges={['top', 'bottom']} preset="fixed">
      <Diagnostics />
    </Screen>
  );
}

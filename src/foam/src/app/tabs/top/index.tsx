import { DeferUntilFocused } from '@app/components/DeferUntilFocused/DeferUntilFocused';
import { TopScreen } from '@app/screens/Top/TopScreen';

export default function TopRoute() {
  return (
    <DeferUntilFocused>
      <TopScreen />
    </DeferUntilFocused>
  );
}

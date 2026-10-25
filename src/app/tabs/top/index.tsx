import { DeferUntilFocused } from '@app/components/defer-until-focused/DeferUntilFocused';
import { TopScreen } from '@app/screens/top/TopScreen';

export default function TopRoute() {
  return (
    <DeferUntilFocused>
      <TopScreen />
    </DeferUntilFocused>
  );
}

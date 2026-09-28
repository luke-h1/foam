import { DeferUntilFocused } from '@app/components/defer-until-focused/defer-until-focused';
import { TopScreen } from '@app/screens/top/top-screen';

export default function TopRoute() {
  return (
    <DeferUntilFocused>
      <TopScreen />
    </DeferUntilFocused>
  );
}

import { DeferUntilFocused } from '@app/components/defer-until-focused/defer-until-focused';
import { StreamListLayoutMenu } from '@app/components/stream-list-layout-toggle/stream-list-layout-menu';
import { TopScreen } from '@app/screens/top/top-screen';

export default function TopRoute() {
  return (
    <>
      <StreamListLayoutMenu />
      <DeferUntilFocused>
        <TopScreen />
      </DeferUntilFocused>
    </>
  );
}

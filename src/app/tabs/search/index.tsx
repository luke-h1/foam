import { DeferUntilFocused } from '@app/components/defer-until-focused/defer-until-focused';
import { SearchScreen } from '@app/screens/search-screen/search-screen';

export default function SearchRoute() {
  return (
    <DeferUntilFocused>
      <SearchScreen />
    </DeferUntilFocused>
  );
}

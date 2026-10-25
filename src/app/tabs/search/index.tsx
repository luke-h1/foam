import { DeferUntilFocused } from '@app/components/defer-until-focused/DeferUntilFocused';
import { SearchScreen } from '@app/screens/search/SearchScreen';

export default function SearchRoute() {
  return (
    <DeferUntilFocused>
      <SearchScreen />
    </DeferUntilFocused>
  );
}

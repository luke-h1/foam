import { DeferUntilFocused } from '@app/components/DeferUntilFocused/DeferUntilFocused';
import { SearchScreen } from '@app/screens/SearchScreen/SearchScreen';

export default function SearchRoute() {
  return (
    <DeferUntilFocused>
      <SearchScreen />
    </DeferUntilFocused>
  );
}

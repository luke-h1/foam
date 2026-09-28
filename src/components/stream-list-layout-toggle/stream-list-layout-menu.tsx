import { StreamListLayoutToggle } from '@app/components/stream-list-layout-toggle/stream-list-layout-toggle';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';

export function StreamListLayoutMenu() {
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();

  return (
    <StreamListLayoutToggle
      value={streamListLayout}
      onChange={layout => updatePreferences({ streamListLayout: layout })}
    />
  );
}

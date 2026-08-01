import { StreamListLayoutToggle } from '@app/components/StreamListLayoutToggle/StreamListLayoutToggle';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';

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

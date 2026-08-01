import { StreamListLayoutToggle } from '@app/components/StreamListLayoutToggle/StreamListLayoutToggle';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';

/**
 * Self-sourced layout switcher for the navigation bar. Android renders the
 * compact toggle button; iOS overrides this with a native menu.
 */
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

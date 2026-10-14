import { Stack } from 'expo-router';

import { StreamListLayoutToggle } from '@app/components/stream-list-layout-toggle/stream-list-layout-toggle';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';

function HeaderLayoutToggle() {
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();

  return (
    <StreamListLayoutToggle
      value={streamListLayout}
      onChange={layout => updatePreferences({ streamListLayout: layout })}
    />
  );
}

const headerRight = () => <HeaderLayoutToggle />;

/**
 * Render it from the page, so it matches the iOS variant, which can only set
 * the header from there.
 */
export function StreamListLayoutMenu() {
  return <Stack.Screen options={{ headerRight }} />;
}

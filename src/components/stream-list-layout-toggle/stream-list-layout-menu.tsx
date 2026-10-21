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

export function StreamListLayoutMenu({ hidden = false }: { hidden?: boolean }) {
  return <Stack.Screen options={hidden ? {} : { headerRight }} />;
}

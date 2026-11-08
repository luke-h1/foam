import { Stack } from 'expo-router';

import { selection } from '@app/lib/haptics';
import {
  type Preferences,
  updatePreferences,
  usePreference,
} from '@app/store/preference-store';

function chooseLayout(layout: Preferences['streamListLayout']) {
  selection();
  updatePreferences({ streamListLayout: layout });
}

export function StreamListLayoutMenu({ hidden = false }: { hidden?: boolean }) {
  const streamListLayout = usePreference('streamListLayout');

  return (
    <Stack.Toolbar placement='right'>
      <Stack.Toolbar.Menu
        accessibilityLabel='Layout'
        hidden={hidden}
        icon='ellipsis'
        title='Layout'
      >
        <Stack.Toolbar.MenuAction
          icon='list.bullet'
          isOn={streamListLayout === 'compact'}
          onPress={() => chooseLayout('compact')}
        >
          {/* oxlint-disable-next-line react-doctor/rn-no-raw-text -- MenuAction reads its title from string children and renders a native UIAction, not a View. */}
          Compact
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon='rectangle.grid.1x2'
          isOn={streamListLayout === 'media'}
          onPress={() => chooseLayout('media')}
        >
          {/* oxlint-disable-next-line react-doctor/rn-no-raw-text -- MenuAction reads its title from string children and renders a native UIAction, not a View. */}
          Media
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}

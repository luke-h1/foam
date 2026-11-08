import { type Preferences, usePreferences } from '@app/store/preference-store';

import {
  DEVTOOLS_TOGGLE_SECTIONS,
  type DevtoolsToggleKey,
} from '../util/settingsMenu';

const DEVTOOLS_TOGGLE_KEYS = DEVTOOLS_TOGGLE_SECTIONS.flatMap(section =>
  section.toggles.map(toggle => toggle.key),
);

export function useDevtoolsToggleValues(): Pick<
  Preferences,
  DevtoolsToggleKey
> {
  return usePreferences(DEVTOOLS_TOGGLE_KEYS);
}

import {
  SettingsSection,
  SettingsSegmentedRow,
} from '@app/components/settings-section/SettingsSection';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';

import { PAINT_RENDERER_HELP, PAINT_RENDERER_OPTIONS } from '../constants';

export function PaintRendererSection() {
  const sevenTvPaintRenderer = usePreference('sevenTvPaintRenderer');

  if (!isDevToolsEnabled) {
    return null;
  }

  return (
    <SettingsSection title='7TV Paint Renderer'>
      <SettingsSegmentedRow
        title='7TV Paint Renderer'
        subtitle={PAINT_RENDERER_HELP}
        icon={{ icon: 'paintbrush.fill' }}
        options={PAINT_RENDERER_OPTIONS}
        value={sevenTvPaintRenderer}
        onValueChange={value =>
          updatePreferences({ sevenTvPaintRenderer: value })
        }
      />
    </SettingsSection>
  );
}

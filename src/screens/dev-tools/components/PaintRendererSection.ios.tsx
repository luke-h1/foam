import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import {
  type SevenTvPaintRenderer,
  updatePreferences,
  usePreference,
} from '@app/store/preference-store';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';

import { PAINT_RENDERER_HELP, PAINT_RENDERER_OPTIONS } from '../constants';

function isPaintRenderer(value: string): value is SevenTvPaintRenderer {
  return PAINT_RENDERER_OPTIONS.some(option => option.value === value);
}

export function PaintRendererSection() {
  const sevenTvPaintRenderer = usePreference('sevenTvPaintRenderer');

  if (!isDevToolsEnabled) {
    return null;
  }

  return (
    <Section
      title='7TV Paint Renderer'
      footer={<NativeText>{PAINT_RENDERER_HELP}</NativeText>}
    >
      <Picker
        label='7TV Paint Renderer'
        systemImage='paintbrush.fill'
        selection={sevenTvPaintRenderer}
        onSelectionChange={value =>
          isPaintRenderer(value)
            ? updatePreferences({ sevenTvPaintRenderer: value })
            : undefined
        }
      >
        {PAINT_RENDERER_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
    </Section>
  );
}

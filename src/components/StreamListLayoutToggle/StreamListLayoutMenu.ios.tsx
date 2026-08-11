import { Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { accessibilityLabel, tag, tint } from '@expo/ui/swift-ui/modifiers';

import { selection } from '@app/lib/haptics';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';

export function StreamListLayoutMenu() {
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();

  return (
    <Host style={{ height: 34, width: 34 }}>
      <Menu
        label={
          <Image
            systemName={
              streamListLayout === 'compact' ? 'list.bullet' : 'square.grid.2x2'
            }
            modifiers={[
              tint(theme.color.text.dark),
              accessibilityLabel('Change stream layout'),
            ]}
          />
        }
      >
        <Picker
          selection={streamListLayout}
          onSelectionChange={layout => {
            selection();
            updatePreferences({ streamListLayout: layout });
          }}
        >
          <Text modifiers={[tag('compact')]}>Compact</Text>
          <Text modifiers={[tag('media')]}>Media</Text>
        </Picker>
      </Menu>
    </Host>
  );
}

import { ListItem, RNHostView, Row, Text } from '@expo/ui/jetpack-compose';
import { clickable } from '@expo/ui/jetpack-compose/modifiers';

import { SettingsRowLeading } from '@app/components/settings-section/components/SettingsRowLeading.android';
import { SettingsRowText } from '@app/components/settings-section/components/SettingsRowText.android';
import { listItemColors } from '@app/components/settings-section/constants';
import type { SettingsLinkRowProps } from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { theme } from '@app/styles/themes';

export function SettingsLinkRow({
  title,
  subtitle,
  icon,
  value,
  onPress,
  danger,
}: SettingsLinkRowProps) {
  return (
    <ListItem
      colors={listItemColors}
      modifiers={onPress ? [clickable(onPress, { indication: true })] : []}
    >
      <SettingsRowLeading {...{ icon, danger }} />
      <SettingsRowText {...{ title, subtitle, danger }} />
      {value || onPress ? (
        <ListItem.TrailingContent>
          <Row
            verticalAlignment='center'
            horizontalArrangement={{ spacedBy: 8 }}
          >
            {value ? (
              <Text
                color={theme.color.textSecondary.dark}
                style={{ typography: 'bodyMedium', fontWeight: '600' }}
              >
                {value}
              </Text>
            ) : null}
            {onPress ? (
              <RNHostView matchContents>
                <SymbolView
                  name='chevron.right'
                  size={18}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </RNHostView>
            ) : null}
          </Row>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}

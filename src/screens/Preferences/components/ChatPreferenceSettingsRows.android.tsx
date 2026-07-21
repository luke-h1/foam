import { useColorScheme } from 'react-native';
import type { ComponentProps } from 'react';

import { Column, Row, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';

import { SettingsRow } from '@app/components/SettingsSection/SettingsSection';
import { type ComposeRowComponent } from '@app/components/SettingsSection/SettingsSection.types';
import { theme } from '@app/styles/themes';

type SettingsRowIcon = ComponentProps<typeof SettingsRow>['icon'];

export function ChatPreferenceSegmentedSettingsRow({
  title,
  subtitle,
  icon,
  selectedIndex,
  onSelectIndex,
  values,
}: {
  title: string;
  subtitle: string;
  icon: SettingsRowIcon;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  values: readonly string[];
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Column modifiers={[fillMaxWidth()]}>
      <SettingsRow title={title} subtitle={subtitle} icon={icon} />
      <Row modifiers={[fillMaxWidth(), padding(16, 0, 16, 12)]}>
        <Row
          modifiers={[
            fillMaxWidth(),
            clip(Shapes.RoundedCorner(10)),
            background(theme.color.menu.card[scheme]),
            padding(3, 3, 3, 3),
          ]}
        >
          {values.map((value, index) => {
            const selected = index === selectedIndex;
            return (
              <Row
                key={value}
                horizontalArrangement='center'
                verticalAlignment='center'
                modifiers={[
                  weight(1),
                  clip(Shapes.RoundedCorner(8)),
                  background(
                    selected
                      ? theme.color.menu.cardActive[scheme]
                      : 'transparent',
                  ),
                  clickable(() => onSelectIndex(index), {
                    indication: false,
                  }),
                  padding(0, 8, 0, 8),
                ]}
              >
                <Text
                  color={
                    selected
                      ? theme.color.text[scheme]
                      : theme.color.textSecondary[scheme]
                  }
                  style={{
                    typography: 'labelLarge',
                    fontWeight: selected ? '600' : '400',
                  }}
                >
                  {value}
                </Text>
              </Row>
            );
          })}
        </Row>
      </Row>
    </Column>
  );
}

(ChatPreferenceSegmentedSettingsRow as ComposeRowComponent).isComposeRow = true;

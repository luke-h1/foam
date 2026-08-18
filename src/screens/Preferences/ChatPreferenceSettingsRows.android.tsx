// This file's shape usages are @expo/ui SwiftUI/Jetpack Compose API names
// (clipShape, shapes, Shape, contentShape and their option/prop keys), not a
// naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import type { ComponentProps } from 'react';

import { Column, Row, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  padding,
  selectable,
  selectableGroup,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';

import { SettingsRow } from '@app/components/SettingsSection/SettingsSection';
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
  return (
    <Column modifiers={[fillMaxWidth()]}>
      <SettingsRow title={title} subtitle={subtitle} icon={icon} />
      <Row modifiers={[fillMaxWidth(), padding(16, 0, 16, 12)]}>
        <Row
          modifiers={[
            fillMaxWidth(),
            clip(Shapes.RoundedCorner(10)),
            background(theme.color.menu.card),
            padding(3, 3, 3, 3),
            selectableGroup(),
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
                    selected ? theme.color.menu.cardActive : 'transparent',
                  ),
                  selectable(selected, () => onSelectIndex(index), 'tab'),
                  padding(0, 8, 0, 8),
                ]}
              >
                <Text
                  color={
                    selected
                      ? theme.color.text.dark
                      : theme.color.textSecondary.dark
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

ChatPreferenceSegmentedSettingsRow.isComposeRow = true;

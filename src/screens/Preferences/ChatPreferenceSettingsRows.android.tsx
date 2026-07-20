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

import {
  type ComposeRowComponent,
  SettingsRow,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';

type SettingsRowIcon = ComponentProps<typeof SettingsRow>['icon'];

/**
 * Android variant: label row and segmented control are both native Compose,
 * grouped in a `Column` and tagged as a Compose row so they sit directly in
 * the Card rather than being hosted outside the tree via RNHostView.
 */
export function ChatPreferenceSegmentedSettingsRow({
  title,
  subtitle,
  icon,
  selectedIndex,
  onChange,
  onValueChange,
  values,
}: {
  title: string;
  subtitle: string;
  icon: SettingsRowIcon;
  selectedIndex: number;
  onChange: (event: { nativeEvent: { selectedSegmentIndex: number } }) => void;
  onValueChange: (value: string) => void;
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
                  clickable(
                    () => {
                      onChange({
                        nativeEvent: { selectedSegmentIndex: index },
                      });
                      onValueChange(value);
                    },
                    { indication: false },
                  ),
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

(ChatPreferenceSegmentedSettingsRow as ComposeRowComponent).isComposeRow = true;

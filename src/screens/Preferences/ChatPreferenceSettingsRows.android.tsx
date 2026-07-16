import type { ComponentProps } from 'react';

import {
  Column,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

import {
  type ComposeRowComponent,
  SettingsRow,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';

type SettingsRowIcon = ComponentProps<typeof SettingsRow>['icon'];

/**
 * Android variant. The RN version wraps a Compose `SettingsRow` in a plain
 * `View`, which the Compose `SettingsSection` then hosts via RNHostView -
 * placing the row's `ListItem` outside the Card tree so it fails to render.
 * Here the label row and the segmented control are both native Compose,
 * grouped in a `Column` and tagged as a Compose row so they sit directly in
 * the Card.
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
      <SingleChoiceSegmentedButtonRow
        modifiers={[fillMaxWidth(), padding(16, 0, 16, 12)]}
      >
        {values.map((value, index) => (
          <SegmentedButton
            key={value}
            selected={index === selectedIndex}
            onClick={() => {
              onChange({ nativeEvent: { selectedSegmentIndex: index } });
              onValueChange(value);
            }}
            colors={{
              activeContainerColor: theme.color.menu.cardActive,
              activeBorderColor: theme.colorBorderSecondary,
              inactiveBorderColor: theme.colorBorderSecondary,
            }}
          >
            <SegmentedButton.Label>
              <Text
                color={
                  index === selectedIndex
                    ? theme.color.text.dark
                    : theme.color.textSecondary.dark
                }
                style={{ typography: 'labelLarge' }}
              >
                {value}
              </Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Column>
  );
}

(ChatPreferenceSegmentedSettingsRow as ComposeRowComponent).isComposeRow = true;

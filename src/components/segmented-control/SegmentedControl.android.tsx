import { StyleSheet } from 'react-native';

import {
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { FoamComposeHost } from '@app/components/compose-host/FoamComposeHost';
import { selection } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';

interface SegmentedControlProps {
  items: readonly { label: string }[];
  currentIndex: number;
  onChange: (index: number) => void;
}

const segmentColors = {
  activeBorderColor: theme.color.border.dark,
  activeContainerColor: theme.color.surfaceElevated.dark,
  activeContentColor: theme.color.text.dark,
  inactiveBorderColor: theme.color.border.dark,
  inactiveContainerColor: theme.color.surfaceNeutral.dark,
  inactiveContentColor: theme.color.textSecondary.dark,
};

/**
 * The Compose content of the control without its host, for a Compose tree
 * that already has one, such as a settings row.
 */
export function SegmentedButtons({
  items,
  currentIndex,
  onChange,
}: SegmentedControlProps) {
  return (
    <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
      {items.map((item, index) => (
        <SegmentedButton
          key={item.label}
          colors={segmentColors}
          enabled
          onClick={() => {
            onChange(index);
            selection();
          }}
          selected={index === currentIndex}
        >
          <SegmentedButton.Label>
            <Text
              color={
                index === currentIndex
                  ? theme.color.text.dark
                  : theme.color.textSecondary.dark
              }
              style={{ typography: 'labelLarge' }}
            >
              {item.label}
            </Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      ))}
    </SingleChoiceSegmentedButtonRow>
  );
}

export function SegmentedControl(props: SegmentedControlProps) {
  return (
    <FoamComposeHost
      matchContents={{ vertical: true }}
      style={styles.container}
    >
      <SegmentedButtons {...props} />
    </FoamComposeHost>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});

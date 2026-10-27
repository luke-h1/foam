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
  items: { label: string }[];
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

export function SegmentedControl({
  items,
  currentIndex,
  onChange,
}: SegmentedControlProps) {
  return (
    <FoamComposeHost
      matchContents={{ vertical: true }}
      style={styles.container}
    >
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
        {items.map((item, index) => (
          <SegmentedButton
            key={`${item.label}-${index}`}
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
    </FoamComposeHost>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});

import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import { Picker } from '@react-native-picker/picker';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleOnUI } from 'react-native-worklets';
import { Button } from '../Button';
import { Typography } from '../Typography';

export interface BottomSheetModalPickerProps<TOption extends string> {
  value: TOption;
  options: TOption[];
  onOptionSelect: (option: TOption) => void;
  isVisible: SharedValue<boolean>;
}

export function BottomSheetModalPicker<TOption extends string>({
  isVisible,
  onOptionSelect,
  options,
  value,
}: BottomSheetModalPickerProps<TOption>) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { theme } = useUnistyles();

  const toggleBottomSheet = useCallback(
    (visible: boolean) => {
      if (visible) {
        bottomSheetModalRef.current?.present();
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    },
    [bottomSheetModalRef],
  );

  useAnimatedReaction(
    () => isVisible.value,
    visible => {
      scheduleOnUI(toggleBottomSheet, visible);
    },
  );

  const handleClose = useCallback(() => {
    isVisible.value = false;
  }, [isVisible]);

  return (
    <BottomSheetModal ref={bottomSheetModalRef} bottomInset={0}>
      <BottomSheetView>
        <SafeAreaView edges={['bottom']} style={styles.container}>
          <View>
            <Button onPress={handleClose}>
              <Typography color="blue.accent">Cancel</Typography>
            </Button>
          </View>
          <Picker onValueChange={onOptionSelect} selectedValue={value}>
            {options.map(option => (
              <Picker.Item
                key={option}
                label={option}
                value={option}
                fontFamily={theme.font.fontFamily}
                color={theme.colors.accent.accentAlpha}
              />
            ))}
          </Picker>
        </SafeAreaView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white.accentAlpha,
  },
}));

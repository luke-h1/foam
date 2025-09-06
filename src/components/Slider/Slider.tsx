import Component from '@react-native-community/slider';
import range from 'lodash/range';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface SliderProps {
  disabled?: boolean;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  style?: StyleProp<ViewStyle>;
  value: number;
}

export function Slider({
  onChange,
  value,
  disabled,
  max,
  min,
  step,
  style,
}: SliderProps) {
  const { theme } = useUnistyles();
  return (
    <View style={style}>
      {!disabled && step && min && max && (
        <View style={styles.wrapper}>
          {range(min, max + step, step).map(item => (
            <View key={item} style={styles.marker(item <= value)} />
          ))}
        </View>
      )}
      <Component
        disabled={disabled}
        maximumTrackTintColor={theme.colors.gray.ui}
        maximumValue={max}
        minimumTrackTintColor={theme.colors.accent.accent}
        minimumValue={min}
        onValueChange={onChange}
        step={step}
        tapToSeek
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  marker: (enabled: boolean) => ({
    backgroundColor: enabled
      ? theme.colors.accent.accent
      : theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    height: theme.spacing.md,
    width: theme.spacing.sm,
  }),
  markers: {
    height: '100%',
    left: 14,
    position: 'absolute',
    right: 14,
  },
  wrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
}));

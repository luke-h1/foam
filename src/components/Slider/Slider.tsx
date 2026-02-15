import Component from '@react-native-community/slider';
import range from 'lodash/range';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface SliderProps {
  disabled?: boolean;
  maximumTrackTintColor?: string;
  max?: number;
  minimumTrackTintColor?: string;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  style?: StyleProp<ViewStyle>;
  thumbTintColor?: string;
  value: number;
}

export function Slider({
  onChange,
  value,
  disabled,
  maximumTrackTintColor,
  max,
  minimumTrackTintColor,
  min,
  step,
  style,
  thumbTintColor,
}: SliderProps) {
  const { theme } = useUnistyles();
  const maxTrack = maximumTrackTintColor ?? theme.colors.gray.ui;
  const minTrack = minimumTrackTintColor ?? theme.colors.accent.accent;
  const thumb = thumbTintColor ?? theme.colors.accent.accent;
  return (
    <View style={style}>
      {!disabled && step && min != null && max != null && (
        <View style={styles.wrapper}>
          {range(min, max + step, step).map(item => (
            <View key={item} style={styles.marker(item <= value)} />
          ))}
        </View>
      )}
      <Component
        disabled={disabled}
        maximumTrackTintColor={maxTrack}
        maximumValue={max}
        minimumTrackTintColor={minTrack}
        minimumValue={min}
        onValueChange={onChange}
        step={step}
        tapToSeek
        thumbTintColor={thumb}
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

import { theme } from '@app/styles/themes';
import Component from '@react-native-community/slider';
import range from 'lodash/range';
import { View, type StyleProp, type ViewStyle, StyleSheet } from 'react-native';

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
  const maxTrack = maximumTrackTintColor ?? theme.colors.gray.ui;
  const minTrack = minimumTrackTintColor ?? theme.colors.accent.accent;
  const thumb = thumbTintColor ?? theme.colors.accent.accent;
  return (
    <View style={style}>
      {!disabled && step && min != null && max != null && (
        <View style={styles.wrapper}>
          {range(min, max + step, step).map(item => (
            <View
              key={item}
              style={[
                styles.marker,
                item <= value ? styles.markerEnabled : styles.markerDisabled,
              ]}
            />
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

const styles = StyleSheet.create({
  marker: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    height: theme.spacing.md,
    width: theme.spacing.sm,
  },
  markerDisabled: {
    backgroundColor: theme.colors.gray.ui,
  },
  markerEnabled: {
    backgroundColor: theme.colors.accent.accent,
  },
  wrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
});

import { memo } from 'react';

import { type CustomPressableProps, PressableScale } from 'pressto';

import { impact, selection } from '@app/lib/haptics';
import { createHitslop } from '@app/utils/string/createHitSlop';

type ButtonHaptic = 'selection' | 'light' | 'medium' | 'heavy';

export type ButtonProps = CustomPressableProps & {
  label?: string;
  disabled?: boolean;
  haptic?: ButtonHaptic;
};

function triggerHaptic(haptic: ButtonHaptic) {
  if (haptic === 'selection') {
    void selection();
    return;
  }
  void impact(haptic);
}

function ButtonComponent({
  children,
  onPress,
  style,
  hitSlop = createHitslop(10),
  label,
  disabled,
  haptic,
  rippleColor,
  ...touchableProps
}: ButtonProps) {
  const handlePress: typeof onPress = event => {
    if (haptic) {
      triggerHaptic(haptic);
    }
    onPress?.(event);
  };

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole='button'
      accessibilityState={{ disabled: Boolean(disabled) }}
      {...touchableProps}
      hitSlop={hitSlop}
      style={style}
      enabled={!disabled}
      rippleColor={
        rippleColor ??
        (process.env.EXPO_OS === 'android'
          ? 'rgba(255, 255, 255, 0.12)'
          : undefined)
      }
      onPress={handlePress}
    >
      {children}
    </PressableScale>
  );
}
export const Button = memo(ButtonComponent);

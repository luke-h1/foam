import { memo } from 'react';

import { type CustomPressableProps, PressableScale } from 'pressto';

import { impact, selection } from '@app/lib/haptics';
import { createHitslop } from '@app/utils/string/create-hit-slop';

type ButtonHaptic = 'selection' | 'light' | 'medium' | 'heavy';

export type ButtonProps = Omit<CustomPressableProps, 'disabled' | 'onPress'> & {
  label?: string | undefined;
  disabled?: boolean | undefined;
  haptic?: ButtonHaptic | undefined;
  onPress?: CustomPressableProps['onPress'] | undefined;
};

function triggerHaptic(haptic: ButtonHaptic) {
  if (haptic === 'selection') {
    selection();
    return;
  }
  impact(haptic);
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
  const handlePress: NonNullable<CustomPressableProps['onPress']> = event => {
    if (haptic) {
      triggerHaptic(haptic);
    }
    onPress?.(event);
  };

  const androidRipple =
    process.env.EXPO_OS === 'android' ? 'rgba(255, 255, 255, 0.12)' : undefined;

  const resolvedRipple = rippleColor ?? androidRipple;

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole='button'
      accessibilityState={{ disabled: Boolean(disabled) }}
      {...touchableProps}
      hitSlop={hitSlop}
      style={style}
      enabled={!disabled}
      {...(resolvedRipple !== undefined ? { rippleColor: resolvedRipple } : {})}
      onPress={handlePress}
    >
      {children}
    </PressableScale>
  );
}

export const Button = memo(ButtonComponent);

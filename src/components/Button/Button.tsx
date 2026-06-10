import { memo } from 'react';
import { createHitslop } from '@app/utils/string/createHitSlop';
import { impact, selection } from '@app/lib/haptics';
import { PressableScale, type CustomPressableProps } from 'pressto';

type ButtonHaptic = 'selection' | 'light' | 'medium' | 'heavy';

export type ButtonProps = CustomPressableProps & {
  label?: string;
  disabled?: boolean;
  /**
   * Opt-in haptic fired on press. Reserve for decision-shaped actions
   * (send, confirm, destructive); plain navigation taps stay silent.
   */
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
      {...touchableProps}
      hitSlop={hitSlop}
      style={style}
      enabled={!disabled}
      onPress={handlePress}
    >
      {children}
    </PressableScale>
  );
}
export const Button = memo(ButtonComponent);

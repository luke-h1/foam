import { createHitslop } from '@app/utils/string/createHitSlop';
import { PressableScale, type CustomPressableProps } from 'pressto';

export type ButtonProps = CustomPressableProps & {
  label?: string;
  disabled?: boolean;
};

export function Button({
  children,
  onPress,
  style,
  hitSlop = createHitslop(10),
  label,
  disabled,
  ...touchableProps
}: ButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={label}
      {...touchableProps}
      hitSlop={hitSlop}
      style={style}
      enabled={!disabled}
      onPress={onPress}
    >
      {children}
    </PressableScale>
  );
}

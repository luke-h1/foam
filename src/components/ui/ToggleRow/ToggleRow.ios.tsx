import { Text as NativeText, Toggle } from '@expo/ui/swift-ui';

import { ToggleRowProps } from './ToggleRow.types';

export function ToggleRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
}: ToggleRowProps) {
  const systemImage = typeof icon === 'string' ? icon : icon?.ios;

  return (
    <Toggle isOn={value} systemImage={systemImage} onIsOnChange={onValueChange}>
      <NativeText>{title}</NativeText>
      {subtitle ? <NativeText>{subtitle}</NativeText> : null}
    </Toggle>
  );
}

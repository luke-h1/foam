import { Switch as JetpackSwitch } from '@expo/ui/jetpack-compose';

interface Props {
  disabled?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}

export function Switch({ disabled, onValueChange, value }: Props) {
  return (
    <JetpackSwitch
      enabled={!disabled}
      onCheckedChange={onValueChange}
      value={Boolean(value)}
    />
  );
}

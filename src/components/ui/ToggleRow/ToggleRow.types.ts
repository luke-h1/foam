import { SymbolViewProps } from 'expo-symbols';

export interface ToggleRowProps {
  title: string;
  subtitle?: string;
  icon?: SymbolViewProps['name'];
  value: boolean;
  onValueChange: (value: boolean) => void;
}

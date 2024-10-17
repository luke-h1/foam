import { View } from 'react-native';

export interface ThemeProps {
  light?: string;
  dark?: string;
}

export type ViewProps = ThemeProps &
  View['props'] & {
    animated?: boolean;
  };

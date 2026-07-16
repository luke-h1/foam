import { ReactNode } from 'react';

import { SymbolViewProps } from 'expo-symbols';

export interface FormScreenProps {
  children: ReactNode;
}

export interface FormSectionProps {
  title?: string;
  children: ReactNode;
}

export interface FormInfoRowProps {
  label: string;
  value: ReactNode;
}

export interface FormActionRowProps {
  title: string;
  icon?: SymbolViewProps['name'];
  onPress: () => void;
}

export interface FormRawRowProps {
  children: ReactNode;
}

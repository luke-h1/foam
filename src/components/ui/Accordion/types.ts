import { ReactNode } from 'react';
import { AccordionThemeValue } from './presets';

type AccordionIcons = 'chevron' | 'cross';
type AccordionType = 'single' | 'multiple';

export interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (id: string) => void;
  theme: AccordionThemeValue;
  spacing: number;
}

export interface AccordionProps {
  children: ReactNode;
  type?: AccordionType;
  theme?: AccordionThemeValue;
  spacing?: number;
}

export interface AccordionItemProps {
  children: ReactNode;
  value: string;
  pop?: boolean;
  icon?: AccordionIcons;
  popScale?: number;
  isLast?: boolean;
}

export interface AccordionTriggerProps {
  children: ReactNode;
}

export interface AccordionContentProps {
  children: ReactNode;
}

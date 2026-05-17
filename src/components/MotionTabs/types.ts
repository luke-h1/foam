import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ReactNode } from 'react';

interface MotionTabPalette {
  accent: string;
  border: string;
  foreground: string;
  muted: string;
  surface: string;
}

interface MotionTabItem {
  icon: <T extends boolean>(
    focused: T,
    color: string,
    size: number,
  ) => ReactNode;
  key: string;
  label: string;
  routeName: string;
}

type AnimatedTabBarProps = BottomTabBarProps;

interface MorphTabProps {
  active: boolean;
  colors: MotionTabPalette;
  index: number;
  item: MotionTabItem;
  onPress: (item: MotionTabItem, index: number) => void;
}

interface TabToolbarProps {
  activeKey?: string;
  colors: MotionTabPalette;
  items: MotionTabItem[];
  onPress: (item: MotionTabItem, index: number) => void;
}

export type {
  AnimatedTabBarProps,
  MorphTabProps,
  MotionTabItem,
  MotionTabPalette,
  TabToolbarProps,
};

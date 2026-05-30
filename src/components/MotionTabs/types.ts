import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import type { SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';

interface NativeTabBarOverlayItem {
  iconName: SymbolViewProps['name'];
  key: string;
  label: string;
  routeName: string;
}

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
  NativeTabBarOverlayItem,
};

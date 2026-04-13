import {
  impactAsync,
  AndroidHaptics,
  performAndroidHapticsAsync,
  ImpactFeedbackStyle,
} from 'expo-haptics';
import { isValidElement, ReactElement, ReactNode } from 'react';
import { Platform, SectionList, VirtualizedList } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { SCREEN_HEIGHT } from './constants';
import type { SnapPoint } from './types';

export const parseSnapPoint = <S extends SnapPoint>(snapPoint: S): number => {
  if (typeof snapPoint === 'number') {
    return snapPoint;
  }
  const percentage = parseFloat(snapPoint);
  return (SCREEN_HEIGHT * percentage) / 100;
};

export const triggerHaptic = () => {
  if (Platform.OS === 'ios') {
    try {
      void impactAsync(ImpactFeedbackStyle.Medium);
    } catch {
      // empty
    }
  }

  try {
    void performAndroidHapticsAsync(AndroidHaptics.Toggle_On);
  } catch {
    // empty
  }
};

export const isScrollableList = (
  element: ReactNode,
): element is ReactElement => {
  if (!isValidElement(element)) {
    return false;
  }

  const { type } = element;

  if (type === FlatList || type === SectionList || type === VirtualizedList) {
    return true;
  }
  const typeWithName = type as {
    displayName?: string;
    name?: string;
  };
  const typeName = typeWithName.displayName ?? typeWithName.name ?? '';

  return (
    typeName.includes('FlatList') ||
    typeName.includes('SectionList') ||
    typeName.includes('VirtualizedList') ||
    typeName.includes('FlashList')
  );
};

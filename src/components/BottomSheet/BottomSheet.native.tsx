import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import {
  type Detent,
  ModalBottomSheet,
} from '@swmansion/react-native-bottom-sheet';

import { BottomSheetSurface } from './BottomSheetSurface';

const bottomSheetSurfaceElement = <BottomSheetSurface />;

export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

function resolveSnapPoint(snapPoint: SnapPoint, windowHeight: number): Detent {
  if (snapPoint === 'full') {
    return Math.round(windowHeight);
  }

  if ('height' in snapPoint) {
    return snapPoint.height;
  }

  return Math.round(windowHeight * snapPoint.fraction);
}

function resolveDetents(
  enableFixedSnapPoints: boolean | undefined,
  snapPoints: SnapPoint[] | undefined,
  windowHeight: number,
): Detent[] {
  if (!enableFixedSnapPoints || !snapPoints?.length) {
    return [0, 'content'];
  }

  return [
    0,
    ...snapPoints.map(snapPoint => resolveSnapPoint(snapPoint, windowHeight)),
  ];
}

export function BottomSheet({
  children,
  enableFixedSnapPoints,
  isPresented,
  onDismiss,
  showDragIndicator,
  snapPoints,
  testID,
}: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const detents = resolveDetents(
    enableFixedSnapPoints,
    snapPoints,
    windowHeight,
  );
  const initialOpenIndex = detents.length > 1 ? 1 : 0;
  const [index, setIndex] = useState(isPresented ? initialOpenIndex : 0);
  const didDismissRef = useRef(false);
  const presentationKey = `${isPresented}:${initialOpenIndex}`;
  const lastPresentationKeyRef = useRef(presentationKey);

  useLayoutEffect(() => {
    if (lastPresentationKeyRef.current !== presentationKey) {
      lastPresentationKeyRef.current = presentationKey;
      setIndex(isPresented ? initialOpenIndex : 0);
    }
    didDismissRef.current = false;
  }, [initialOpenIndex, isPresented, presentationKey]);

  if (!isPresented) {
    return null;
  }

  return (
    <ModalBottomSheet
      animateIn
      detents={detents}
      index={index}
      onIndexChange={nextIndex => {
        setIndex(nextIndex);
        if (nextIndex === 0 && !didDismissRef.current) {
          didDismissRef.current = true;
          onDismiss();
        }
      }}
      scrimColor='rgba(0, 0, 0, 0.42)'
      surface={bottomSheetSurfaceElement}
    >
      <View testID={testID} style={styles.content}>
        {showDragIndicator ? (
          <View style={styles.dragHandleRow}>
            <View style={styles.dragIndicator} />
          </View>
        ) : null}
        {children}
      </View>
    </ModalBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  dragHandleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    paddingTop: 10,
    width: '100%',
  },
  dragIndicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    height: 5,
    width: 36,
  },
});

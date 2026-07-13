import { useLayoutEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { PropsWithChildren } from 'react';

import {
  BottomSheet as SwmBottomSheet,
  type Detent,
} from '@swmansion/react-native-bottom-sheet';
import { Toaster } from 'sonner-native';

import { theme } from '@app/styles/themes';

import { BottomSheetSurface } from './BottomSheetSurface';

const bottomSheetSurfaceElement = <BottomSheetSurface />;

const SHEET_INSET = 16;
const SHEET_CORNER_RADIUS = theme.borderRadius28;

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
      didDismissRef.current = false;
    }
  }, [initialOpenIndex, isPresented, presentationKey]);

  if (!isPresented) {
    return null;
  }

  return (
    <Modal
      animationType='none'
      onRequestClose={() => {
        setIndex(0);
      }}
      statusBarTranslucent
      transparent
      visible
    >
      <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Close'
          onPress={() => {
            setIndex(0);
          }}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <SwmBottomSheet
          animateIn
          bottomInset={SHEET_INSET}
          cornerRadius={SHEET_CORNER_RADIUS}
          detents={detents}
          index={index}
          onIndexChange={setIndex}
          onSettle={settledIndex => {
            if (settledIndex === 0 && !didDismissRef.current) {
              didDismissRef.current = true;
              onDismiss();
            }
          }}
          style={styles.sheetHost}
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
        </SwmBottomSheet>
        {process.env.EXPO_OS === 'android' ? (
          <Toaster style={styles.toaster} />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
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
    paddingTop: 8,
    width: '100%',
  },
  dragIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 999,
    height: 5,
    width: 36,
  },
  sheetHost: {
    left: SHEET_INSET,
    right: SHEET_INSET,
  },
  toaster: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderWidth: 1,
  },
});

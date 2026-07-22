import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import type { PropsWithChildren, Ref } from 'react';

import {
  BottomSheet as SwmBottomSheet,
  type Detent,
} from '@swmansion/react-native-bottom-sheet';
import { Toaster } from 'sonner-native';

import { theme } from '@app/styles/themes';

import type { BottomSheetHandle } from './bottomSheetHandle';
import { BottomSheetSurface } from './BottomSheetSurface';

const bottomSheetSurfaceElement = <BottomSheetSurface />;

const SHEET_INSET = 16;
const SHEET_CORNER_RADIUS = theme.borderRadius28;

export type { BottomSheetHandle };
export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  ref?: Ref<BottomSheetHandle>;
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
  ref,
  showDragIndicator,
  snapPoints,
  testID,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const { height: windowHeight } = useWindowDimensions();
  const detents = resolveDetents(
    enableFixedSnapPoints,
    snapPoints,
    windowHeight,
  );
  const initialOpenIndex = detents.length > 1 ? 1 : 0;
  const [index, setIndex] = useState(isPresented ? initialOpenIndex : 0);
  const [isMounted, setIsMounted] = useState(isPresented);
  const didDismissRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      requestClose: () => {
        setIndex(0);
      },
    }),
    [],
  );

  const [prevPresentation, setPrevPresentation] = useState({
    openIndex: initialOpenIndex,
    presented: isPresented,
  });
  if (
    isPresented !== prevPresentation.presented ||
    (isPresented && initialOpenIndex !== prevPresentation.openIndex)
  ) {
    setPrevPresentation({
      openIndex: initialOpenIndex,
      presented: isPresented,
    });
    if (isPresented) {
      setIsMounted(true);
      setIndex(initialOpenIndex);
    } else {
      setIndex(0);
    }
  }

  useLayoutEffect(() => {
    if (isPresented) {
      didDismissRef.current = false;
    }
  }, [isPresented]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      animationType='none'
      onRequestClose={() => {
        setIndex(0);
      }}
      statusBarTranslucent
      navigationBarTranslucent
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
              setIsMounted(false);
              onDismiss();
            }
          }}
          style={styles.sheetHost}
          surface={bottomSheetSurfaceElement}
        >
          <View testID={testID} style={styles.content}>
            {showDragIndicator ? (
              <View style={styles.dragHandleRow}>
                <View
                  style={[
                    styles.dragIndicator,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(0, 0, 0, 0.28)'
                          : 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                />
              </View>
            ) : null}
            {children}
          </View>
        </SwmBottomSheet>
        {process.env.EXPO_OS === 'android' ? (
          <Toaster
            style={{
              backgroundColor: theme.color.background[scheme],
              borderColor: theme.color.border[scheme],
              borderWidth: 1,
            }}
          />
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
    borderRadius: 999,
    height: 5,
    width: 36,
  },
  sheetHost: {
    left: SHEET_INSET,
    right: SHEET_INSET,
  },
});

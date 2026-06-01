import {
  ModalBottomSheet,
  type Detent,
} from '@swmansion/react-native-bottom-sheet';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
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

export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator,
  snapPoints,
  testID,
}: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const detents = useMemo<Detent[]>(
    () => [
      0,
      ...(snapPoints?.map(snapPoint =>
        resolveSnapPoint(snapPoint, windowHeight),
      ) ?? ['content' as const]),
    ],
    [snapPoints, windowHeight],
  );
  const initialOpenIndex = detents.length > 1 ? 1 : 0;
  const [index, setIndex] = useState(isPresented ? initialOpenIndex : 0);
  const didDismissRef = useRef(false);

  useEffect(() => {
    didDismissRef.current = false;
    setIndex(isPresented ? initialOpenIndex : 0);
  }, [initialOpenIndex, isPresented]);

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
      surface={<View style={[StyleSheet.absoluteFill, styles.surface]} />}
    >
      <View testID={testID} style={styles.content}>
        {showDragIndicator ? <View style={styles.dragIndicator} /> : null}
        {children}
      </View>
    </ModalBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  dragIndicator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 999,
    height: 4,
    marginBottom: 8,
    marginTop: 8,
    width: 36,
  },
  surface: {
    backgroundColor: 'transparent',
  },
});

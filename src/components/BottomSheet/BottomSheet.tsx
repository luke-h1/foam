import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';

export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

function BottomSheetComponent({
  children,
  isPresented,
  showDragIndicator,
  testID,
}: BottomSheetProps) {
  if (!isPresented) {
    return null;
  }

  return (
    <View testID={testID} style={styles.fallback}>
      {showDragIndicator ? (
        <View style={styles.dragHandleRow}>
          <View style={styles.dragIndicator} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dragHandleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    paddingTop: 10,
    width: '100%',
  },
  dragIndicator: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderRadius: 999,
    height: 4,
    width: 36,
  },
  fallback: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
  },
});

export const BottomSheet = memo(BottomSheetComponent);

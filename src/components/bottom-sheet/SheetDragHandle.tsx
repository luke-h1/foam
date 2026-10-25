import { StyleSheet, View } from 'react-native';

/**
 * `@expo/ui` never renders `handleComponent` on iOS/Android and its handle
 * style props do nothing, so hide the native grabber and draw this instead.
 */
export function SheetDragHandle() {
  return (
    <View pointerEvents='none' style={styles.row} testID='sheet-drag-handle'>
      <View style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 2.5,
    height: 5,
    width: 36,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 8,
    width: '100%',
  },
});

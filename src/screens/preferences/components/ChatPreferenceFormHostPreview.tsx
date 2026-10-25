import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import { RNHostView } from '@expo/ui/swift-ui';

import { theme } from '@app/styles/themes';

/**
 * Wraps a plain-RN preview so it renders in the SwiftUI Form as a sized, non-interactive row. `padded` matches the Form's row insets; provider toggles opt out because they sit under a Toggle row that already carries that spacing.
 */
export function hostPreview(node: ReactElement, width: number, padded = true) {
  return (
    <RNHostView matchContents>
      <View style={[{ width }, padded ? styles.previewRow : null]}>{node}</View>
    </RNHostView>
  );
}

const styles = StyleSheet.create({
  previewRow: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
});

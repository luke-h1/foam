import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import { RNHostView } from '@expo/ui/swift-ui';

import { theme } from '@app/styles/themes';

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

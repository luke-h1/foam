import { StyleSheet, View } from 'react-native';

import { SettingsRow } from '@app/components/settings-section/SettingsRow';
import type { SettingsLinkRowProps } from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

export function SettingsLinkRow({
  value,
  onPress,
  ...rowProps
}: SettingsLinkRowProps) {
  return (
    <SettingsRow
      {...rowProps}
      // oxlint-disable-next-line react-doctor/jsx-no-jsx-as-prop -- the React Compiler memoizes this element
      trailing={
        <View style={styles.linkTrailing}>
          {value ? (
            <Text type='body' color='gray.textLow'>
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <SymbolView
              name='chevron.right'
              size={18}
              tintColor={theme.colorGreyHoverAlpha}
            />
          ) : null}
        </View>
      }
      {...{ onPress }}
    />
  );
}

const styles = StyleSheet.create({
  linkTrailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
});

import { StyleSheet, Switch, View } from 'react-native';

import { theme } from '@app/styles/themes';

import { SymbolView } from '../Icon/Icon';
import { Text } from '../Text/Text';
import { ToggleRowProps } from './ToggleRow.types';

export function ToggleRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
}: ToggleRowProps) {
  return (
    <View style={styles.row}>
      {icon ? (
        <SymbolView name={icon} size={20} tintColor={theme.colorWhite} />
      ) : null}
      <View style={styles.labels}>
        <Text weight='semibold' color='gray'>
          {title}
        </Text>
        {subtitle ? (
          <Text type='xs' color='gray.textLow'>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flex: 1,
    gap: theme.space4,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
});

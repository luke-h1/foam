import { StyleSheet, View } from 'react-native';

import { ListItem, RNHostView } from '@expo/ui/jetpack-compose';

import {
  resolveIconName,
  type RowIcon,
} from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { theme } from '@app/styles/themes';

interface SettingsRowLeadingProps {
  icon?: RowIcon;
  danger?: boolean;
}

export function SettingsRowLeading({ icon, danger }: SettingsRowLeadingProps) {
  if (!icon) {
    return null;
  }

  return (
    <ListItem.LeadingContent>
      <RNHostView matchContents>
        <View style={[styles.iconWrap, danger ? styles.iconWrapDanger : null]}>
          <SymbolView
            name={resolveIconName(icon.icon, icon.androidIcon)}
            size={20}
            tintColor={danger ? theme.colorRed : theme.color.textSecondary.dark}
          />
        </View>
      </RNHostView>
    </ListItem.LeadingContent>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.sm,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  iconWrapDanger: {
    opacity: 0.9,
  },
});

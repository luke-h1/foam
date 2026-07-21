import { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, useColorScheme } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import {
  dismissActionMenu,
  getActionMenuState,
  subscribeActionMenu,
} from '@app/store/overlays/actionMenuStore';
import { theme } from '@app/styles/themes';

export function ActionMenuHost() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const options = useSyncExternalStore(
    subscribeActionMenu,
    getActionMenuState,
    getActionMenuState,
  );

  if (!options) {
    return null;
  }

  return (
    <Modal transparent animationType='fade' onRequestClose={dismissActionMenu}>
      <Pressable style={styles.backdrop} onPress={dismissActionMenu}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.color.menu.background[scheme] },
          ]}
        >
          <Text type='sm' color='gray.textLow' style={styles.title}>
            {options.title}
          </Text>
          {options.actions.map(action => (
            <Pressable
              key={action.label}
              style={[
                styles.row,
                { borderTopColor: theme.color.border[scheme] },
              ]}
              onPress={() => {
                dismissActionMenu();
                action.onPress();
              }}
            >
              <Text weight='semibold' color='gray'>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.row, { borderTopColor: theme.color.border[scheme] }]}
            onPress={dismissActionMenu}
          >
            <Text weight='semibold' color='gray.textLow'>
              {options.cancelLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  row: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: theme.space16,
  },
  sheet: {
    borderTopLeftRadius: theme.borderRadius16,
    borderTopRightRadius: theme.borderRadius16,
    paddingHorizontal: theme.space16,
  },
  title: {
    paddingVertical: theme.space12,
    textAlign: 'center',
  },
});

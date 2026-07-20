import { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import {
  dismissActionMenu,
  getActionMenuState,
  subscribeActionMenu,
} from '@app/store/overlays/actionMenuStore';
import { theme } from '@app/styles/themes';

/**
 * Web fallback host; iOS uses `ActionSheetIOS` and Android the Compose
 * `ModalBottomSheet`, so this renders nothing on those platforms.
 */
export function ActionMenuHost() {
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
        <Pressable style={styles.sheet}>
          <Text type='sm' color='gray.textLow' style={styles.title}>
            {options.title}
          </Text>
          {options.actions.map(action => (
            <Pressable
              key={action.label}
              style={styles.row}
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
          <Pressable style={styles.row} onPress={dismissActionMenu}>
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
    borderTopColor: theme.colorBorderSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: theme.space16,
  },
  sheet: {
    backgroundColor: theme.color.menu.background,
    borderTopLeftRadius: theme.borderRadius16,
    borderTopRightRadius: theme.borderRadius16,
    paddingHorizontal: theme.space16,
  },
  title: {
    paddingVertical: theme.space12,
    textAlign: 'center',
  },
});

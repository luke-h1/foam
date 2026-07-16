import { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import {
  dismissActionMenu,
  getActionMenuState,
  subscribeActionMenu,
} from './actionMenuStore';

/**
 * Web fallback host. iOS routes through `ActionSheetIOS` and Android through the
 * Jetpack Compose `ModalBottomSheet` (`ActionMenuHost.android.tsx`), so neither
 * populates the store and this renders nothing on those platforms. On web the
 * store is the only path, so we render a simple modal sheet here.
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
              style={styles.action}
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
          <Pressable style={styles.cancel} onPress={dismissActionMenu}>
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
  action: {
    alignItems: 'center',
    borderTopColor: theme.colorBorderSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: theme.space16,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  cancel: {
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

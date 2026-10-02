import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { Button } from '@app/components/button/button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

interface SheetHeaderProps {
  title?: string;
  /**
   * Custom leading content, such as a user identity block, in place of the
   * title.
   */
  children?: ReactNode;
  /**
   * An optional text action before the close button, such as "Edit".
   */
  action?: { label: string; onPress: () => void };
  onClose: () => void;
}

/**
 * The top of a chat sheet: a title or custom block, and one close button.
 */
export function SheetHeader({
  title,
  children,
  action,
  onClose,
}: SheetHeaderProps) {
  return (
    <View style={[styles.header, children ? styles.headerTop : null]}>
      <View style={styles.leading}>
        {children ?? (
          <Text type='headline' numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      {action ? (
        <Button label={action.label} onPress={action.onPress} hitSlop={10}>
          <Text type='body' color='accent'>
            {action.label}
          </Text>
        </Button>
      ) : null}
      <Button label='Close' onPress={onClose} style={styles.close}>
        <SymbolView
          name='xmark'
          size={13}
          weight='bold'
          tintColor={theme.color.textSecondary.dark}
        />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  close: {
    alignItems: 'center',
    backgroundColor: theme.color.surfaceElevated.dark,
    borderRadius: theme.radius.full,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 36,
  },
  /**
   * A custom block (an avatar and a meta line) can be taller than one row,
   * so the close button stays at its top edge.
   */
  headerTop: {
    alignItems: 'flex-start',
  },
  leading: {
    flex: 1,
    minWidth: 0,
  },
});

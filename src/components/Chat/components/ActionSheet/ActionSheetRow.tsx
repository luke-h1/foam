import { StyleSheet, useColorScheme, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export type MessageActionId =
  | 'copy'
  | 'reply'
  | 'hide-user'
  | 'highlight-user'
  | 'hide-phrase'
  | 'pin-message'
  | 'update-pin'
  | 'unpin-message'
  | 'delete-message'
  | 'timeout-user'
  | 'ban-user';

export type ActionItem = {
  id: MessageActionId;
  label: string;
  onPress: () => void;
  subtitle?: string;
  tone?: 'accent' | 'danger' | 'default' | 'warning';
};

function getMessageActionSFSymbolName(actionId: MessageActionId) {
  switch (actionId) {
    case 'copy':
      return 'doc.on.doc' as const;
    case 'reply':
      return 'arrowshape.turn.up.left' as const;
    case 'hide-user':
      return 'person.crop.circle.badge.xmark' as const;
    case 'highlight-user':
      return 'star' as const;
    case 'hide-phrase':
      return 'nosign' as const;
    case 'pin-message':
      return 'pin' as const;
    case 'update-pin':
      return 'pin.fill' as const;
    case 'unpin-message':
      return 'pin.slash' as const;
    case 'delete-message':
      return 'trash' as const;
    case 'timeout-user':
      return 'clock' as const;
    case 'ban-user':
      return 'slash.circle' as const;
    default:
      return 'questionmark.circle' as const;
  }
}

export function ActionSheetRow({
  action,
  showBottomBorder,
}: {
  action: ActionItem;
  showBottomBorder: boolean;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <Button
      onPress={action.onPress}
      style={[
        styles.actionButton,
        showBottomBorder && [
          styles.actionButtonBorder,
          { borderBottomColor: theme.color.border[scheme] },
        ],
      ]}
    >
      <View style={styles.actionContent}>
        <View
          style={[
            styles.actionIconFrame,
            {
              backgroundColor: theme.color.pressedOverlay[scheme],
            },
            action.tone === 'accent' && {
              backgroundColor: theme.color.accentSurface[scheme],
            },
            action.tone === 'warning' && {
              backgroundColor: `${theme.color.warning[scheme]}29`,
            },
            action.tone === 'danger' && {
              backgroundColor: theme.color.dangerSurface[scheme],
            },
          ]}
        >
          <SymbolView
            name={getMessageActionSFSymbolName(action.id)}
            size={18}
            tintColor={
              action.tone === 'danger'
                ? theme.color.danger[scheme]
                : action.tone === 'warning'
                  ? theme.color.amber[scheme]
                  : action.tone === 'accent'
                    ? theme.color.accent[scheme]
                    : theme.color.textSecondary[scheme]
            }
            weight='regular'
            style={styles.actionIcon}
          />
        </View>
        <View style={styles.actionCopy}>
          <Text
            weight='semibold'
            style={[
              styles.actionText,
              { color: theme.color.text[scheme] },
              action.tone === 'danger' && {
                color: theme.color.danger[scheme],
              },
            ]}
          >
            {action.label}
          </Text>
          {action.subtitle ? (
            <Text
              style={[
                styles.actionSubtitle,
                { color: theme.color.textSecondary[scheme] },
              ]}
            >
              {action.subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: 'transparent',
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionIconFrame: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionSubtitle: {
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
  actionText: {
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
});

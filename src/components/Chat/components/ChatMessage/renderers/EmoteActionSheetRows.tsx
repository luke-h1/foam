import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export type EmoteActionId =
  'copy-name' | 'copy-url' | 'copy-url-2x' | 'copy-url-4x' | 'preview';

export type EmoteActionRow = {
  id: EmoteActionId;
  label: string;
  onPress: () => void;
};

function getEmoteActionSFSymbolName(actionId: EmoteActionId) {
  switch (actionId) {
    case 'copy-name':
    case 'copy-url':
    case 'copy-url-2x':
    case 'copy-url-4x':
      return 'doc.on.doc' as const;
    case 'preview':
      return 'arrow.up.right.square' as const;
    default:
      return 'doc.on.doc' as const;
  }
}

export function EmoteActionSheetRows({
  actions,
}: {
  actions: EmoteActionRow[];
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.actionGroup,
        { backgroundColor: theme.color.surfaceAlpha[scheme] },
      ]}
    >
      {actions.map((action, index) => (
        <Button
          key={action.label}
          onPress={action.onPress}
          style={[
            styles.actionButton,
            index > 0 && [
              styles.actionButtonWithDivider,
              { borderTopColor: theme.color.border[scheme] },
            ],
          ]}
        >
          <View
            style={[
              styles.actionIconFrame,
              { backgroundColor: theme.color.pressedOverlay[scheme] },
            ]}
          >
            <SymbolView
              name={getEmoteActionSFSymbolName(action.id)}
              size={18}
              tintColor={theme.color.textSecondary[scheme]}
              weight='regular'
              style={styles.actionIcon}
            />
          </View>
          <View style={styles.actionCopy}>
            <Text
              style={[styles.actionText, { color: theme.color.text[scheme] }]}
              weight='semibold'
            >
              {action.label}
            </Text>
          </View>
        </Button>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  actionButtonWithDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
  },
  actionGroup: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionIconFrame: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionText: {
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
});

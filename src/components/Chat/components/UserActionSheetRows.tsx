import { StyleSheet, useColorScheme, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export type UserActionItem = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress?: () => void;
  subtitle: string;
  tone?: 'accent' | 'danger' | 'default' | 'warning';
};

export function UserActionSheetRows({
  actions,
  onDone,
}: {
  actions: UserActionItem[];
  onDone: () => void;
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
          style={[
            styles.actionButton,
            index < actions.length - 1 && [
              styles.actionButtonBorder,
              { borderBottomColor: theme.color.border[scheme] },
            ],
          ]}
          onPress={() => {
            action.onPress?.();
            onDone();
          }}
        >
          <View
            style={[
              styles.actionIconFrame,
              { backgroundColor: theme.color.surfaceAlpha[scheme] },
              action.tone === 'accent' && {
                backgroundColor: theme.color.accentSurface[scheme],
              },
              action.tone === 'warning' && {
                backgroundColor:
                  scheme === 'dark'
                    ? 'rgba(224,163,58,0.16)'
                    : 'rgba(200,133,26,0.14)',
              },
              action.tone === 'danger' && {
                backgroundColor: theme.color.dangerSurface[scheme],
              },
            ]}
          >
            <SymbolView
              name={action.icon}
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
            <Text
              style={[
                styles.actionSubtitle,
                { color: theme.color.textSecondary[scheme] },
              ]}
            >
              {action.subtitle}
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
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionGroup: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
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

import { StyleSheet, useColorScheme, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
  disabled?: boolean;
};

export function EmotePreviewActions({ actions }: { actions: PreviewAction[] }) {
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
          disabled={action.disabled}
          style={[
            styles.actionButton,
            index < actions.length - 1 && [
              styles.actionButtonBorder,
              { borderBottomColor: theme.color.border[scheme] },
            ],
          ]}
        >
          <View
            style={[
              styles.actionIconFrame,
              { backgroundColor: theme.color.accentSurface[scheme] },
            ]}
          >
            <SymbolView
              name={action.icon}
              tintColor={theme.color.accent[scheme]}
              size={18}
            />
          </View>
          <View style={styles.actionCopy}>
            <Text
              style={[styles.actionText, { color: theme.color.text[scheme] }]}
              weight='semibold'
            >
              {action.label}
            </Text>
            <Text
              style={[
                styles.actionSubtitle,
                { color: theme.color.textSecondary[scheme] },
              ]}
              numberOfLines={1}
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

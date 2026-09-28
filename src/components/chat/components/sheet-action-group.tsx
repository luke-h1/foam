import { StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/button';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

export type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
  disabled?: boolean;
};

/**
 * The stacked action rows at the foot of a preview sheet. Shared by the badge
 * and emote sheets, which offer the same row shape over different payloads.
 */
export function SheetActionGroup({ actions }: { actions: PreviewAction[] }) {
  return (
    <View style={styles.actionGroup}>
      {actions.map((action, index) => (
        <Button
          key={action.label}
          onPress={action.onPress}
          disabled={action.disabled}
          style={[
            styles.actionButton,
            index < actions.length - 1 && styles.actionButtonBorder,
          ]}
        >
          <View style={styles.actionIconFrame}>
            <SymbolView
              name={action.icon}
              tintColor={theme.colorPrimary}
              size={18}
            />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionText} weight='semibold'>
              {action.label}
            </Text>
            <Text style={styles.actionSubtitle} numberOfLines={1}>
              {action.subtitle}
            </Text>
          </View>
        </Button>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(46,134,255,0.16)',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
  actionSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
});

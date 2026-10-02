import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { PressableArea } from '@app/components/pressable-area/pressable-area';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

interface SectionHeaderProps {
  title: string;
  /**
   * A short count or note shown after the title, such as the number of rows.
   */
  detail?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Heading for a group of rows inside a screen. The space above it separates
 * the groups, so there is no divider.
 */
export function SectionHeader({
  title,
  detail,
  actionLabel,
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.header, style]} accessibilityRole='header'>
      <Text type='title3' numberOfLines={1} style={styles.title}>
        {title}
        {detail ? (
          <Text type='title3' weight='normal' color='gray.textLow' tabular>
            {`  ${detail}`}
          </Text>
        ) : null}
      </Text>

      {actionLabel && onActionPress ? (
        <PressableArea onPress={onActionPress} hitSlop={12}>
          <Text type='subhead' color='accent'>
            {actionLabel}
          </Text>
        </PressableArea>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.space12,
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space24,
  },
  title: {
    flex: 1,
  },
});

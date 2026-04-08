import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

interface ViewerMilestoneNoticeProps {
  part: ParsedPart<'viewermilestone'>;
}

export function ViewerMileStoneNotice({ part }: ViewerMilestoneNoticeProps) {
  const unescapedSystemMsg = useMemo(() => {
    if (!part.systemMsg) {
      return '';
    }
    return unescapeIrcTag(part.systemMsg);
  }, [part.systemMsg]);

  if (!unescapedSystemMsg) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text color="gray.text" style={styles.messageText}>
        {unescapedSystemMsg}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.uiActive,
    borderCurve: 'continuous',
    borderLeftColor: theme.colors.violet.accent,
    borderLeftWidth: 3,
    borderRightColor: theme.colors.violet.accent,
    borderRightWidth: 3,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.sm,
    width: '100%',
  },
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
});

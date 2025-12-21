import { Typography } from '@app/components/Typography';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { useMemo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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
      <Typography color="gray.text" style={styles.messageText}>
        {unescapedSystemMsg}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    width: '100%',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray.uiActive,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: theme.colors.violet.accent,
    borderRightColor: theme.colors.violet.accent,
    borderCurve: 'continuous',
    marginVertical: theme.spacing.xs,
  },
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
}));

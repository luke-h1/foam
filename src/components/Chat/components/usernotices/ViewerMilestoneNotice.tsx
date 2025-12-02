import { Typography } from '@app/components/Typography';
import { ParsedPart } from '@app/utils';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { useMemo } from 'react';
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
    <Typography color="gray.text" style={styles.messageText}>
      {unescapedSystemMsg}
    </Typography>
  );
}

const styles = StyleSheet.create(theme => ({
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
}));

import { Text } from '@app/components/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

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
  const displayName = part.displayName?.trim() || '';

  const messageBody = useMemo(() => {
    if (part.category === 'watch-streak' && part.value) {
      const streamCount = parseInt(part.value, 10);
      const streamText = streamCount === 1 ? 'stream' : 'streams';
      return `watched ${part.value} consecutive ${streamText} and sparked a watch streak!`;
    }

    if (!unescapedSystemMsg) {
      return '';
    }

    if (
      displayName &&
      unescapedSystemMsg
        .toLowerCase()
        .startsWith(`${displayName.toLowerCase()} `)
    ) {
      return unescapedSystemMsg.slice(displayName.length).trimStart();
    }

    return unescapedSystemMsg;
  }, [displayName, part.category, part.value, unescapedSystemMsg]);

  if (!displayName && !messageBody) {
    return null;
  }

  return (
    <Text color="gray.text" style={styles.messageText}>
      {displayName ? (
        <Text color="gray.text" style={styles.displayNameText}>
          {displayName}
        </Text>
      ) : null}
      {messageBody ? (
        <Text color="gray.textLow" style={styles.eventBodyText}>
          {displayName ? ` ${messageBody}` : messageBody}
        </Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  displayNameText: {
    fontWeight: '700',
  },
  eventBodyText: {
    fontWeight: '500',
  },
  messageText: {
    flexShrink: 1,
    lineHeight: 22,
  },
});

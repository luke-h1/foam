import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { formatMentionContent } from '@app/utils/chat/resolveMentionLogin';
import { useSelector } from '@legendapp/state/react';
import { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { styles } from '../RichChatMessage.styles';
import { normaliseUsername } from '@app/components/Chat/util/richChatMessageHelpers';

interface MentionSpanProps {
  content: string;
  baseTextStyle: StyleProp<TextStyle>;
  fontScaleStyle: StyleProp<TextStyle>;
  emoteLineStyle?: StyleProp<TextStyle>;
  compact?: boolean;
  getMentionColor?: (username: string) => string;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  normalisedCurrentUsername?: string;
  replyPlainMentionTarget?: string;
}

/**
 * A single @mention span. It subscribes to `mentionLoginRevision` itself so that
 * when a mention's canonical login/colour resolves from Helix, ONLY the visible
 * mention spans re-render — not every chat row. Keeping the revision out of the
 * list's `extraData` (which would re-render the whole window on every resolve)
 * is the difference between ~57fps and a flat 60fps in mention-heavy chat.
 */
function MentionSpanComponent({
  content,
  baseTextStyle,
  fontScaleStyle,
  emoteLineStyle,
  compact,
  getMentionColor,
  effectiveHighlightedUserSet,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
}: MentionSpanProps) {
  useSelector(chatStore$.mentionLoginRevision);

  const mentionContent = formatMentionContent(content);
  const mentionedUsername = mentionContent.replace(/^@/, '').trim();
  const normalisedMentionedUsername = normaliseUsername(mentionedUsername);
  const isReplyTargetMention = Boolean(
    replyPlainMentionTarget &&
    normalisedMentionedUsername === replyPlainMentionTarget,
  );

  if (isReplyTargetMention) {
    return (
      <Text color='gray.text' style={baseTextStyle}>
        {mentionContent}
      </Text>
    );
  }

  const mentionColor = getMentionColor
    ? getMentionColor(mentionedUsername)
    : generateRandomTwitchColor(mentionedUsername);
  const isHighlightedMention =
    effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
    normalisedCurrentUsername === normalisedMentionedUsername;

  return (
    <Text
      style={[
        styles.mention,
        compact && styles.mentionCompact,
        fontScaleStyle,
        emoteLineStyle,
        isHighlightedMention && styles.mentionHighlighted,
        { color: mentionColor },
      ]}
    >
      {mentionContent}
    </Text>
  );
}

export const MentionSpan = memo(MentionSpanComponent);

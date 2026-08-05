import { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { getChatColorStyle } from '@app/components/Chat/util/chatColorStyles';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { formatMentionContent } from '@app/utils/chat/resolveMentionLogin/formatMentionContent';

import type { ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';

interface MentionSpanProps {
  content: string;
  baseTextStyle?: StyleProp<TextStyle>;
  emoteLineStyle?: StyleProp<TextStyle>;
  compact?: boolean;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  getMentionColor?: (username: string) => string;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  normalisedCurrentUsername?: string;
  replyPlainMentionTarget?: string;
}

/**
 * A single @mention span. It subscribes to `mentionLoginRevision` itself so that
 * when a mention's canonical login/colour resolves from Helix, ONLY the visible
 * mention spans re-render - not every chat row. Keeping the revision out of the
 * list's `extraData` (which would re-render the whole window on every resolve)
 * is the difference between ~57fps and a flat 60fps in mention-heavy chat.
 */
function MentionSpanComponent({
  content,
  baseTextStyle,
  emoteLineStyle,
  compact,
  fontScale,
  isModerated,
  getMentionColor,
  effectiveHighlightedUserSet,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
}: MentionSpanProps) {
  useSelector(chatStore$.mentionLoginRevision);

  const mentionContent = formatMentionContent(content);
  if (!mentionContent.trim()) {
    return null;
  }
  const mentionedUsername = mentionContent.replace(/^@/, '').trim();
  const normalisedMentionedUsername = normaliseChatUsername(mentionedUsername);
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
        getChatTextStyles(fontScale, compact).mention,
        emoteLineStyle,
        isHighlightedMention && styles.mentionHighlighted,
        getChatColorStyle(mentionColor),
        isModerated && styles.moderatedMessageText,
      ]}
    >
      {mentionContent}
    </Text>
  );
}

export const MentionSpan = memo(MentionSpanComponent);

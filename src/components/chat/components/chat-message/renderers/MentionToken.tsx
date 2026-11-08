import { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { formatMentionContent } from '@app/utils/chat/resolve-mention-login/formatMentionContent';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';

interface MentionTokenProps {
  content: string;
  baseTextStyle?: StyleProp<TextStyle>;
  emoteLineStyle?: StyleProp<TextStyle>;
  density?: ChatDensity;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  getMentionColor?: (username: string) => string;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  normalisedCurrentUsername?: string;
  replyPlainMentionTarget?: string;
}

/**
 * A single @mention span; self-subscribes to `mentionLoginRevision` so a
 * Helix resolve re-renders only visible mention spans, not every chat row.
 */
function MentionTokenComponent({
  content,
  baseTextStyle,
  emoteLineStyle,
  density,
  fontScale,
  isModerated,
  getMentionColor,
  effectiveHighlightedUserSet,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
}: MentionTokenProps) {
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
      <ChatText color='gray.text' style={baseTextStyle}>
        {mentionContent}
      </ChatText>
    );
  }

  const mentionColor = getMentionColor
    ? getMentionColor(mentionedUsername)
    : resolveMentionColor(mentionedUsername);

  const isHighlightedMention =
    effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
    normalisedCurrentUsername === normalisedMentionedUsername;

  return (
    <ChatText
      style={[
        getChatTextStyles(fontScale, density).mention,
        emoteLineStyle,
        isHighlightedMention && styles.mentionHighlighted,
        getChatColorStyle(mentionColor),
        isModerated && styles.moderatedMessageText,
      ]}
    >
      {mentionContent}
    </ChatText>
  );
}

export const MentionToken = memo(MentionTokenComponent);

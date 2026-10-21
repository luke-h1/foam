import { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { getChatColorStyle } from '@app/components/chat/util/chat-color-styles';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { formatMentionContent } from '@app/utils/chat/resolve-mention-login/format-mention-content';

import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import type { ChatFontScale } from '../util/chat-scale';

interface MentionTokenProps {
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
 * A single @mention span; self-subscribes to `mentionLoginRevision` so a
 * Helix resolve re-renders only visible mention spans, not every chat row.
 */
function MentionTokenComponent({
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
    : generateRandomTwitchColor(mentionedUsername);

  const isHighlightedMention =
    effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
    normalisedCurrentUsername === normalisedMentionedUsername;

  return (
    <ChatText
      style={[
        getChatTextStyles(fontScale, compact).mention,
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

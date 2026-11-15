import { memo } from 'react';
import type { TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { formatMentionContent } from '@app/utils/chat/resolve-mention-login/formatMentionContent';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';

import { styles } from '../ChatRow.styles';
import { ChatRowText } from '../ChatRowText';
import { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';

interface MentionTokenProps {
  content: string;
  baseRowTextStyle: TextStyle;
  emoteLineStyle?: TextStyle;
  density?: ChatDensity;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  getMentionColor?: (username: string) => string;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  normalisedCurrentUsername?: string;
  replyPlainMentionTarget?: string;
}

function MentionTokenComponent({
  content,
  baseRowTextStyle,
  emoteLineStyle,
  density,
  fontScale,
  isModerated,
  getMentionColor,
  effectiveHighlightedUserSet,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
}: MentionTokenProps) {
  const mentionContent = useSelector(() => {
    chatStore$.mentionLoginRevision.get();
    return formatMentionContent(content);
  });

  const mentionedUsername = mentionContent.replace(/^@/, '').trim();

  const mentionColor = useSelector(() => {
    chatStore$.mentionLoginRevision.get();
    return getMentionColor
      ? getMentionColor(mentionedUsername)
      : resolveMentionColor(mentionedUsername);
  });

  if (!mentionContent.trim()) {
    return null;
  }

  const normalisedMentionedUsername = normaliseChatUsername(mentionedUsername);

  const isReplyTargetMention = Boolean(
    replyPlainMentionTarget &&
    normalisedMentionedUsername === replyPlainMentionTarget,
  );

  if (isReplyTargetMention) {
    return <ChatRowText style={baseRowTextStyle}>{mentionContent}</ChatRowText>;
  }

  const isHighlightedMention =
    effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
    normalisedCurrentUsername === normalisedMentionedUsername;

  return (
    <ChatRowText
      style={getChatRowTextStyle(
        'muted',
        getChatTextStyles(fontScale, density).mention,
        emoteLineStyle,
        isHighlightedMention && styles.mentionHighlighted,
        getChatColorStyle(mentionColor),
        isModerated && styles.moderatedMessageText,
      )}
    >
      {mentionContent}
    </ChatRowText>
  );
}

export const MentionToken = memo(MentionTokenComponent);

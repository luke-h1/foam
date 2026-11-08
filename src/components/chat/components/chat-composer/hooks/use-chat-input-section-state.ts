import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReplyToData } from '@app/components/chat/components/ChatInputSection.types';
import { isRefreshCommand } from '@app/components/chat/util/slash-command-definitions/isRefreshCommand';
import { messageLength } from '@app/utils/chat/maxMessageLength';

import { formatReplyPrefix } from '../util/formatReplyPrefix';
import { useComposerDismissGesture } from './use-composer-dismiss-gesture';

interface UseChatInputSectionStateOptions {
  isAuthenticated: boolean;
  messageInput: string;
  replyTo: ReplyToData | null;
}

function getInputPlaceholder(
  isAuthenticated: boolean,
  replyTo: ReplyToData | null,
): string {
  if (!isAuthenticated) {
    return 'Sign in to send messages';
  }

  if (replyTo !== null) {
    return `Reply to ${replyTo.username}...`;
  }

  return 'Send a message...';
}

export function useChatInputSectionState({
  isAuthenticated,
  messageInput,
  replyTo,
}: UseChatInputSectionStateOptions) {
  const insets = useSafeAreaInsets();

  const { composerAnimatedStyle, composerGesture } =
    useComposerDismissGesture();

  const canSend =
    messageInput.trim().length > 0 &&
    (isAuthenticated || isRefreshCommand(messageInput));

  return {
    canSend,
    composerAnimatedStyle,
    composerGesture,
    inputPlaceholder: getInputPlaceholder(isAuthenticated, replyTo),
    insets,
    reservedCharacters: replyTo
      ? messageLength(formatReplyPrefix(replyTo.username))
      : 0,
  };
}

import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';

import { groupTextRuns } from '../util/groupTextRuns';
import { ChatMessageToken } from './ChatMessageToken';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

type WrappedTokensProps = ChatTokenRenderProps & {
  mode: 'message' | 'system';
};

export function WrappedTokens({
  mode,
  message,
  density,
  disableEmoteAnimations,
  fontScale,
  effectiveHighlightedUserSet,
  getMentionColor,
  isModerated,
  onEmoteTouchStart,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
  textColor,
}: WrappedTokensProps) {
  /**
   * A literal, not object-rest: rest materialization is a fresh object the
   * React Compiler cannot cache, invalidating every memo scope keyed on it.
   */
  const rendererArgs = {
    density,
    disableEmoteAnimations,
    fontScale,
    effectiveHighlightedUserSet,
    getMentionColor,
    isModerated,
    onEmoteTouchStart,
    normalisedCurrentUsername,
    noticeTags,
    parseTextForEmotes,
    replyPlainMentionTarget,
    emoteTargetSize,
    textColor,
  };

  return (
    <>
      {groupTextRuns(message).map(run => {
        const token =
          run.kind === 'text'
            ? { type: 'text' as const, content: run.content }
            : run.token;

        return (
          <ChatMessageToken
            key={getTokenIdentity(token, run.index)}
            {...rendererArgs}
            {...{ index: run.index, message, mode, token }}
          />
        );
      })}
    </>
  );
}

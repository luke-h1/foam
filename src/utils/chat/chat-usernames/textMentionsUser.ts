import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { matchMentionLogin } from '@app/utils/chat/chat-usernames/twitchLogin';

/**
 * Raw-text mention check for live messages whose emote parse is deferred to
 * commit time, where there are no mention tokens to scan yet. It splits words
 * with the same rule as the tokenizer, so it agrees with `scanChatBody`.
 */
export function textMentionsUser(
  text: string,
  normalisedUser: string,
): boolean {
  if (!normalisedUser || !text.includes('@')) {
    return false;
  }

  return text
    .split(/\s+/)
    .some(
      word =>
        normaliseChatUsername(matchMentionLogin(word)?.login) ===
        normalisedUser,
    );
}

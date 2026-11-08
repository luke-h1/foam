const TWITCH_LOGIN_PATTERN = /^@([a-z0-9_]{1,25})(?![a-z0-9_])/i;

export interface MentionLoginMatch {
  login: string;
  rest: string;
}

export function matchMentionLogin(word: string): MentionLoginMatch | null {
  const match = TWITCH_LOGIN_PATTERN.exec(word);
  const login = match?.[1];

  if (!match || !login) {
    return null;
  }

  return { login, rest: word.slice(match[0].length) };
}

export function isTwitchLogin(value: string): boolean {
  return matchMentionLogin(`@${value}`)?.rest === '';
}

export function textHasMention(text: string): boolean {
  return text.split(/\s+/).some(word => TWITCH_LOGIN_PATTERN.test(word));
}

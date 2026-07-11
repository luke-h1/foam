import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { mentionChatterIndex } from '@app/utils/chat/resolveMentionLogin/mentionChatterIndex';
import { mentionLoginIndex } from '@app/utils/chat/resolveMentionLogin/mentionLoginIndex';
import type { MentionChatter } from '@app/utils/chat/resolveMentionLogin/types';

function compareMentionChatters(
  left: MentionChatter,
  right: MentionChatter,
  query: string,
): number {
  const leftLogin = left.login.toLowerCase();
  const rightLogin = right.login.toLowerCase();
  const leftStarts = leftLogin.startsWith(query);
  const rightStarts = rightLogin.startsWith(query);

  if (leftStarts !== rightStarts) {
    return leftStarts ? -1 : 1;
  }

  return left.login.localeCompare(right.login, undefined, {
    sensitivity: 'base',
  });
}

export function searchMentionChatters(
  query: string,
  limit = 20,
  _mentionLoginRevision = 0,
): MentionChatter[] {
  void _mentionLoginRevision;
  const normalisedQuery = query.trim().toLowerCase();
  if (!normalisedQuery) {
    return [];
  }

  const matches = new Map<string, MentionChatter>();

  mentionChatterIndex.forEach(chatter => {
    const login = chatter.login.toLowerCase();
    if (login.includes(normalisedQuery)) {
      matches.set(login, chatter);
    }
  });

  mentionLoginIndex.forEach(login => {
    const key = login.toLowerCase();
    if (!key.includes(normalisedQuery) || matches.has(key)) {
      return;
    }

    matches.set(key, {
      login,
      userId: key,
      color: generateRandomTwitchColor(login),
    });
  });

  const results = Array.from(matches.values());
  results.sort((left, right) =>
    compareMentionChatters(left, right, normalisedQuery),
  );
  return results.slice(0, limit);
}

import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { mentionChatterIndex } from '@app/utils/chat/resolveMentionLogin/mentionChatterIndex';
import { mentionLoginIndex } from '@app/utils/chat/resolveMentionLogin/mentionLoginIndex';
import type { MentionChatter } from '@app/utils/chat/resolveMentionLogin/types';

/**
 * `chatter` is null for login-only entries, whose colour is synthesised after
 * the result set has been cut to `limit`.
 */
type MentionCandidate = {
  chatter: MentionChatter | null;
  key: string;
  login: string;
};

/**
 * `String.prototype.localeCompare` with an options object builds a collator per
 * call; one shared instance does the same comparison.
 */
const loginCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

function compareByKey(left: MentionCandidate, right: MentionCandidate): number {
  return loginCollator.compare(left.key, right.key);
}

function toMentionChatter(candidate: MentionCandidate): MentionChatter {
  return (
    candidate.chatter ?? {
      login: candidate.login,
      userId: candidate.key,
      color: generateRandomTwitchColor(candidate.login),
    }
  );
}

/**
 * Both indexes are keyed by the lower-cased login, so matching and ordering
 * read the key rather than lower-casing every entry on each keystroke.
 * Prefix matches outrank substring matches, so bucketing on the way past also
 * removes the need to order the (much larger) substring bucket unless the
 * prefix bucket comes up short.
 */
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

  const prefixed: MentionCandidate[] = [];
  const contained: MentionCandidate[] = [];
  const seen = new Set<string>();

  const collect = (
    key: string,
    login: string,
    chatter: MentionChatter | null,
  ) => {
    const matchIndex = key.indexOf(normalisedQuery);
    if (matchIndex === -1 || seen.has(key)) {
      return;
    }

    seen.add(key);
    (matchIndex === 0 ? prefixed : contained).push({ chatter, key, login });
  };

  mentionChatterIndex.forEach((chatter, key) => {
    collect(key, chatter.login, chatter);
  });
  mentionLoginIndex.forEach((login, key) => {
    collect(key, login, null);
  });

  prefixed.sort(compareByKey);
  const results = prefixed.slice(0, limit);

  if (results.length < limit && contained.length > 0) {
    contained.sort(compareByKey);
    results.push(...contained.slice(0, limit - results.length));
  }

  return results.map(toMentionChatter);
}

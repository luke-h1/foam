import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { clearMentionSessionCaches } from '@app/store/chat/actions/chatColorCaches';
import type { ParsedPart } from './replaceTextWithEmotes';

const mentionLoginIndex = new Map<string, string>();

export type MentionChatter = {
  login: string;
  userId: string;
  color: string;
};

const mentionChatterIndex = new Map<string, MentionChatter>();

export function pickCanonicalLogin(
  existing: string | undefined,
  candidate: string,
): string {
  const trimmed = candidate.trim();
  if (!trimmed) {
    return existing ?? candidate;
  }

  if (!existing) {
    return trimmed;
  }

  const existingHasCase = existing !== existing.toLowerCase();
  const candidateHasCase = trimmed !== trimmed.toLowerCase();

  if (candidateHasCase && !existingHasCase) {
    return trimmed;
  }

  return existing;
}

export function registerMentionLogin(login?: string | null): void {
  const trimmed = login?.trim();
  if (!trimmed) {
    return;
  }

  const key = trimmed.toLowerCase();
  const next = pickCanonicalLogin(mentionLoginIndex.get(key), trimmed);
  if (next === mentionLoginIndex.get(key)) {
    return;
  }

  mentionLoginIndex.set(key, next);
}

export function getMentionLogin(login: string): string {
  const trimmed = login.trim();
  if (!trimmed) {
    return trimmed;
  }

  return mentionLoginIndex.get(trimmed.toLowerCase()) ?? trimmed;
}

export function formatMentionContent(mentionContent: string): string {
  const login = mentionContent.replace(/^@/, '').trim();
  if (!login) {
    return mentionContent;
  }

  return `@${getMentionLogin(login)}`;
}

export function registerMentionLoginsFromParts(parts: ParsedPart[]): void {
  parts.forEach(part => {
    if (part.type !== 'mention' || !('content' in part)) {
      return;
    }

    registerMentionLogin(part.content.replace(/^@/, ''));
  });
}

export function registerMentionLoginsFromSender(
  login?: string | null,
  displayName?: string | null,
): void {
  const normalisedLogin = login?.trim().toLowerCase();
  const display = displayName?.trim();
  if (!normalisedLogin || !display) {
    return;
  }

  if (display.toLowerCase() === normalisedLogin) {
    registerMentionLogin(display);
  }
}

export function applyMentionLoginCasing(parts: ParsedPart[]): ParsedPart[] {
  let didChange = false;

  const nextParts = parts.map(part => {
    if (part.type !== 'mention' || !('content' in part)) {
      return part;
    }

    const login = part.content.replace(/^@/, '').trim();
    registerMentionLogin(login);

    const canonicalLogin = getMentionLogin(login);
    const content = `@${canonicalLogin}`;
    if (content === part.content) {
      return part;
    }

    didChange = true;
    return { ...part, content };
  });

  return didChange ? nextParts : parts;
}

export function registerMentionChatter({
  login,
  userId,
  color,
}: {
  login?: string | null;
  userId?: string | null;
  color?: string | null;
}): void {
  const trimmedLogin = login?.trim();
  if (!trimmedLogin) {
    return;
  }

  registerMentionLogin(trimmedLogin);
  const canonicalLogin = getMentionLogin(trimmedLogin);
  const key = canonicalLogin.toLowerCase();
  const existing = mentionChatterIndex.get(key);
  const resolvedUserId = userId?.trim() || existing?.userId || key;
  const resolvedColor =
    color?.trim() ||
    existing?.color ||
    generateRandomTwitchColor(canonicalLogin);

  mentionChatterIndex.set(key, {
    login: canonicalLogin,
    userId: resolvedUserId,
    color: resolvedColor,
  });
}

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

export function clearMentionLoginIndex(): void {
  mentionLoginIndex.clear();
  mentionChatterIndex.clear();
  clearMentionSessionCaches();
}

export function getMentionLoginIndexSize(): number {
  return mentionLoginIndex.size;
}

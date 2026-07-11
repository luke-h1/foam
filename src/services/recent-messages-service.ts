import { parseJsonOnWorklet } from '@app/lib/offThreadJson';
import type { ParsedIrcMessage } from '@app/types/chat/recentMessages';
import { parseIrcTags } from '@app/utils/chat/ircProtocol';

const RECENT_MESSAGES_URL =
  'https://recent-messages.robotty.de/api/v2/recent-messages';

type RecentMessagesResponse = {
  messages?: unknown;
  error?: unknown;
  error_code?: unknown;
};

export function parseIrcMessage(line: string): ParsedIrcMessage | null {
  if (!line.trim()) {
    return null;
  }

  let remaining = line.trim();
  let tags: Record<string, string> | undefined;
  let prefix: string | undefined;

  if (remaining.startsWith('@')) {
    const tagEnd = remaining.indexOf(' ');
    if (tagEnd === -1) {
      return null;
    }

    tags = parseIrcTags(remaining.slice(1, tagEnd));
    remaining = remaining.slice(tagEnd + 1).trim();
  }

  if (remaining.startsWith(':')) {
    const prefixEnd = remaining.indexOf(' ');
    if (prefixEnd === -1) {
      return null;
    }

    prefix = remaining.slice(1, prefixEnd);
    remaining = remaining.slice(prefixEnd + 1).trim();
  }

  const parts = remaining.split(' ');
  const command = parts[0];
  if (!command) {
    return null;
  }

  const params: string[] = [];
  const paramParts = parts.slice(1);
  const trailingIndex = paramParts.findIndex(part => part.startsWith(':'));

  if (trailingIndex >= 0) {
    params.push(
      ...paramParts.slice(0, trailingIndex),
      paramParts.slice(trailingIndex).join(' ').slice(1),
    );
  } else {
    params.push(...paramParts);
  }

  return { tags, prefix, command, params };
}

export const recentMessagesService = {
  getRecentMessages: async (
    channelName: string,
    signal?: AbortSignal,
    limit?: number,
  ): Promise<string[]> => {
    const query = limit && limit > 0 ? `?limit=${limit}` : '';
    const response = await fetch(
      `${RECENT_MESSAGES_URL}/${encodeURIComponent(channelName)}${query}`,
      { signal },
    );

    if (!response.ok) {
      throw new Error(`Failed to load recent messages: ${response.status}`);
    }

    const payload = await parseJsonOnWorklet<RecentMessagesResponse>(
      await response.text(),
    );
    if (!Array.isArray(payload.messages)) {
      return [];
    }

    return payload.messages.filter(
      (message): message is string => typeof message === 'string',
    );
  },
} as const;

import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { deriveChatBody } from '@app/utils/chat/deriveChatBody';
import type { ChatBodyVariant } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

export type { ChatBodyVariant };

export interface ChatBodyInfo {
  hasSubscriptionNotice: boolean;
  mentionsCurrentUser: boolean;
  variant: ChatBodyVariant;
}

export function normaliseUsername(value?: string): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}

export function getPartIdentity(part: ParsedPart, index: number): string {
  return `${part.type}-${index}`;
}

export function getChatBodyInfo(
  message: ParsedPart[],
  normalisedCurrentUsername?: string,
  sender?: string,
  isTwitchSystemNotice?: boolean,
  isAnnouncement?: boolean,
): ChatBodyInfo {
  const derived = deriveChatBody(message, {
    sender,
    isTwitchSystemNotice,
    isAnnouncement,
  });

  return {
    hasSubscriptionNotice: derived.hasSubscriptionNotice,
    mentionsCurrentUser: normalisedCurrentUsername
      ? derived.mentionLogins.includes(normalisedCurrentUsername)
      : false,
    variant: derived.variant,
  };
}

export function isUserNoticeTags(tags: unknown): tags is UserNoticeTags {
  return (
    typeof tags === 'object' &&
    tags !== null &&
    'msg-id' in tags &&
    typeof (tags as { 'msg-id'?: unknown })['msg-id'] === 'string'
  );
}

export function getAnnouncementColorParam(
  noticeTags: unknown,
): string | undefined {
  if (
    typeof noticeTags === 'object' &&
    noticeTags !== null &&
    'msg-param-color' in noticeTags &&
    typeof (noticeTags as { 'msg-param-color'?: unknown })[
      'msg-param-color'
    ] === 'string'
  ) {
    return (noticeTags as { 'msg-param-color': string })['msg-param-color'];
  }

  return undefined;
}

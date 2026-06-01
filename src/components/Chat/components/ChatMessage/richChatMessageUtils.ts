import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { ReactNode } from 'react';

const SUBSCRIPTION_NOTICE_TYPES = new Set<ParsedPart['type']>([
  'sub',
  'resub',
  'anongiftpaidupgrade',
  'anongift',
  'submysterygift',
  'giftpaidupgrade',
]);

const STV_EMOTE_EVENT_TYPES = new Set<ParsedPart['type']>([
  'stv_emote_added',
  'stv_emote_removed',
]);

const VIEWER_MILESTONE_TYPES = new Set<ParsedPart['type']>(['viewermilestone']);

export type ChatBodyVariant =
  | 'twitch_system_notice'
  | 'subscription'
  | 'stv_emote_event'
  | 'viewer_milestone'
  | 'app_system_sender'
  | 'user_chat';

export interface ChatBodyInfo {
  hasSubscriptionNotice: boolean;
  mentionsCurrentUser: boolean;
  variant: ChatBodyVariant;
}

export function normaliseUsername(value?: string): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}

export function renderParts(
  message: ParsedPart[],
  renderer: (part: ParsedPart, index: number) => ReactNode,
): ReactNode[] {
  const renderedParts: ReactNode[] = [];
  let currentTextPart: ParsedPart<'text'> | null = null;
  let currentTextIndex = 0;

  const pushCurrentTextPart = () => {
    if (!currentTextPart) {
      return;
    }

    renderedParts.push(renderer(currentTextPart, currentTextIndex));
    currentTextPart = null;
  };

  for (let index = 0; index < message.length; index += 1) {
    const part = message[index];
    if (!part) {
      continue;
    }

    if (part.type === 'text') {
      if (currentTextPart) {
        currentTextPart = {
          type: 'text',
          content: currentTextPart.content + part.content,
        };
      } else {
        currentTextPart = part;
        currentTextIndex = index;
      }
      continue;
    }

    pushCurrentTextPart();
    renderedParts.push(renderer(part, index));
  }

  pushCurrentTextPart();

  return renderedParts;
}

export function getPartIdentity(part: ParsedPart, index: number): string {
  switch (part.type) {
    case 'emote':
    case 'mention':
    case 'stvEmote':
    case 'twitchClip':
    case 'text':
      return `${part.type}-${part.id ?? part.content ?? index}`;

    case 'stv_emote_added':
    case 'stv_emote_removed':
      return `${part.type}-${part.stvEvents.data.id}-${index}`;

    case 'viewermilestone':
      return `${part.type}-${part.login}-${part.value}-${index}`;

    case 'sub':
    case 'resub':
    case 'anongiftpaidupgrade':
    case 'anongift':
    case 'submysterygift':
    case 'giftpaidupgrade':
      return `${part.type}-${part.subscriptionEvent.displayName}-${index}`;

    default:
      return `${part.type}-${index}`;
  }
}

export function getChatBodyInfo(
  message: ParsedPart[],
  normalisedCurrentUsername?: string,
  sender?: string,
  isTwitchSystemNotice?: boolean,
): ChatBodyInfo {
  if (isTwitchSystemNotice) {
    return {
      hasSubscriptionNotice: false,
      mentionsCurrentUser: false,
      variant: 'twitch_system_notice',
    };
  }

  let hasSubscriptionNotice = false;
  let hasStvEmoteEvent = false;
  let hasViewerMilestone = false;
  let mentionsCurrentUser = false;

  for (const part of message) {
    if (
      !mentionsCurrentUser &&
      normalisedCurrentUsername &&
      part.type === 'mention' &&
      normaliseUsername(part.content) === normalisedCurrentUsername
    ) {
      mentionsCurrentUser = true;
    }

    if (SUBSCRIPTION_NOTICE_TYPES.has(part.type)) {
      hasSubscriptionNotice = true;
      continue;
    }

    if (STV_EMOTE_EVENT_TYPES.has(part.type)) {
      hasStvEmoteEvent = true;
      continue;
    }

    if (VIEWER_MILESTONE_TYPES.has(part.type)) {
      hasViewerMilestone = true;
    }
  }

  if (hasSubscriptionNotice) {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'subscription',
    };
  }
  if (hasStvEmoteEvent) {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'stv_emote_event',
    };
  }
  if (hasViewerMilestone) {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'viewer_milestone',
    };
  }
  if (sender?.toLowerCase() === 'system') {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'app_system_sender',
    };
  }
  return { hasSubscriptionNotice, mentionsCurrentUser, variant: 'user_chat' };
}

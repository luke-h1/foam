import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
const SUBSCRIPTION_NOTICE_TYPES = new Set<ParsedPart['type']>([
  'sub',
  'resub',
  'anongiftpaidupgrade',
  'anongift',
  'submysterygift',
  'giftpaidupgrade',
  'primepaidupgrade',
]);

const CHARITY_DONATION_TYPES = new Set<ParsedPart['type']>(['charitydonation']);
const RITUAL_NOTICE_TYPES = new Set<ParsedPart['type']>(['ritual']);

const STV_EMOTE_EVENT_TYPES = new Set<ParsedPart['type']>([
  'stv_emote_added',
  'stv_emote_removed',
]);

const VIEWER_MILESTONE_TYPES = new Set<ParsedPart['type']>(['viewermilestone']);

export type ChatBodyVariant =
  | 'twitch_system_notice'
  | 'raid'
  | 'announcement'
  | 'subscription'
  | 'charity_donation'
  | 'ritual'
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
  if (isAnnouncement) {
    return {
      hasSubscriptionNotice: false,
      mentionsCurrentUser: false,
      variant: 'announcement',
    };
  }

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
  let hasCharityDonation = false;
  let hasRitualNotice = false;
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
      continue;
    }

    if (CHARITY_DONATION_TYPES.has(part.type)) {
      hasCharityDonation = true;
      continue;
    }

    if (RITUAL_NOTICE_TYPES.has(part.type)) {
      hasRitualNotice = true;
    }
  }

  if (hasSubscriptionNotice) {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'subscription',
    };
  }
  if (hasCharityDonation) {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'charity_donation',
    };
  }
  if (hasRitualNotice) {
    return {
      hasSubscriptionNotice,
      mentionsCurrentUser,
      variant: 'ritual',
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

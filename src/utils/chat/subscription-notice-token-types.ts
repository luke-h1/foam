import type { MessageToken } from '@app/types/chat/messageToken';

const SUBSCRIPTION_NOTICE_TOKEN_TYPES = [
  'sub',
  'resub',
  'anongift',
  'anongiftpaidupgrade',
  'submysterygift',
  'giftpaidupgrade',
  'primepaidupgrade',
] as const satisfies readonly MessageToken['type'][];

export type SubscriptionNoticeTokenType =
  (typeof SUBSCRIPTION_NOTICE_TOKEN_TYPES)[number];

const SUBSCRIPTION_NOTICE_TOKEN_TYPE_SET: ReadonlySet<MessageToken['type']> =
  new Set(SUBSCRIPTION_NOTICE_TOKEN_TYPES);

export function isSubscriptionNoticeToken(
  token: MessageToken,
): token is MessageToken<SubscriptionNoticeTokenType> {
  return SUBSCRIPTION_NOTICE_TOKEN_TYPE_SET.has(token.type);
}

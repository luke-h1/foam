import type {
  UserNoticeMsgId,
  UserNoticeTagsByVariant,
} from '@app/types/chat/irc-tags/usernotice';

const SUBSCRIPTION_USER_NOTICE_MSG_IDS = [
  'sub',
  'resub',
  'subgift',
  'anonsubgift',
  'submysterygift',
  'anonsubmysterygift',
  'giftpaidupgrade',
  'anongiftpaidupgrade',
  'primepaidupgrade',
  'extendsub',
  'standardpayforward',
  'communitypayforward',
  'primecommunitygiftreceived',
] as const satisfies readonly UserNoticeMsgId[];

export type SubscriptionUserNoticeMsgId =
  (typeof SUBSCRIPTION_USER_NOTICE_MSG_IDS)[number];

export type SubscriptionUserNoticeTags =
  UserNoticeTagsByVariant<SubscriptionUserNoticeMsgId>;

const SUBSCRIPTION_USER_NOTICE_MSG_ID_SET: ReadonlySet<string> = new Set(
  SUBSCRIPTION_USER_NOTICE_MSG_IDS,
);

export function isSubscriptionUserNotice(
  msgId: string | undefined,
): msgId is SubscriptionUserNoticeMsgId {
  return msgId !== undefined && SUBSCRIPTION_USER_NOTICE_MSG_ID_SET.has(msgId);
}

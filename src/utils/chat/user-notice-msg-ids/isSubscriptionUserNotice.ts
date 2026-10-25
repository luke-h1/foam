const SUBSCRIPTION_USER_NOTICE_MSG_IDS = new Set([
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
]);

export function isSubscriptionUserNotice(msgId: string | undefined): boolean {
  return Boolean(msgId && SUBSCRIPTION_USER_NOTICE_MSG_IDS.has(msgId));
}

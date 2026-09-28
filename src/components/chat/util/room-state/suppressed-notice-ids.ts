const ROOMSTATE_NOTICE_IDS = new Set([
  'emote_only_off',
  'emote_only_on',
  'followers_off',
  'followers_on',
  'followers_on_zero',
  'slow_off',
  'slow_on',
  'subs_off',
  'subs_on',
]);

export const SUPPRESSED_NOTICE_IDS = new Set([
  ...ROOMSTATE_NOTICE_IDS,
  'delete_message_success',
]);

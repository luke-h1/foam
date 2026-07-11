import { SUPPRESSED_NOTICE_IDS } from '../SUPPRESSED_NOTICE_IDS';

describe('SUPPRESSED_NOTICE_IDS', () => {
  test('includes room-state and delete success notice ids', () => {
    expect(SUPPRESSED_NOTICE_IDS.has('emote_only_on')).toBe(true);
    expect(SUPPRESSED_NOTICE_IDS.has('slow_on')).toBe(true);
    expect(SUPPRESSED_NOTICE_IDS.has('delete_message_success')).toBe(true);
    expect(SUPPRESSED_NOTICE_IDS.has('msg_banned')).toBe(false);
  });
});

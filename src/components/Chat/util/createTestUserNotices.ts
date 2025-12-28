/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
import { ChatMessageType } from '@app/store/chatStore';
import { generateNonce } from '@app/utils/string/generateNonce';

function createBaseSubNotice(
  subPlan: 'Prime' | '1000' | '2000' | '3000',
  subPlanName: string,
  months: number,
): ChatMessageType<'usernotice', 'sub'> {
  const monthsStr = months.toString();
  const message_id = generateNonce();
  const message_nonce = generateNonce();
  return {
    id: `${message_id}_${message_nonce}`,
    message_nonce,
    badges: [],
    message_id,
    userstate: {
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    channel: 'testchannel',
    sender: 'Test User',
    replyDisplayName: '',
    replyBody: '',
    parentDisplayName: '',
    message: [],
    notice_tags: {
      'msg-id': 'sub',
      'msg-param-cumulative-months': monthsStr,
      'msg-param-should-share-streak': '1',
      'msg-param-streak-months': monthsStr,
      'msg-param-sub-plan': subPlan,
      'msg-param-sub-plan-name': subPlanName,
      'display-name': 'Test User',
      'user-id': '1234567890',
      'user-type': 'user',
      color: '#000000',
      badges: '',
      emotes: '',
      flags: '',
      mod: '0',
      'room-id': '1234567890',
      subscriber: '1',
      'system-msg': `Test User subscribed to the channel`,
      'tmi-sent-ts': '1234567890',
      vip: '1',
      login: 'testuser',
      username: 'Test User',
      'badge-info': `@badge-info=;badges=staff/1,broadcaster/1,turbo/1;color=#008000;display-name=ronni;emotes=;id=db25007f-7a18-43eb-9379-80131e44d633;login=ronni;mod=0;msg-id=resub;msg-param-cumulative-months=6;msg-param-streak-months=2;msg-param-should-share-streak=1;msg-param-sub-plan=Prime;msg-param-sub-plan-name=Prime;room-id=12345678;subscriber=1;system-msg=ronni\shas\ssubscribed\sfor\s6\smonths!;tmi-sent-ts=1507246572675;turbo=1;user-id=87654321;user-type=staff :tmi.twitch.tv USERNOTICE #dallas :Great stream -- keep it up!`,
      id: '1234567890',
    },
  };
}

function createBaseViewerMilestoneNotice(): ChatMessageType<
  'usernotice',
  'viewermilestone'
> {
  const message_id = generateNonce();
  const message_nonce = generateNonce();
  return {
    id: `${message_id}_${message_nonce}`,
    message_nonce,
    badges: [],
    message_id,
    userstate: {
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    channel: 'testchannel',
    sender: 'Test User',
    replyDisplayName: '',
    replyBody: '',
    parentDisplayName: '',
    message: [],
    notice_tags: {
      'system-msg':
        'LimeTitanTV\\swatched\\s20\\sconsecutive\\sstreams\\sand\\ssparked\\sa\\swatch\\sstreak!',
      'msg-id': 'viewermilestone',
      'msg-param-category': 'watch-streak',
      'msg-param-copoReward': '100',
      'msg-param-id': '1234567890',
      'msg-param-value': '10',
      'display-name': 'Test User',
      'user-id': '1234567890',
      'user-type': 'user',
      color: '#000000',
      badges: '',
      emotes: '',
      flags: '',
      mod: '0',
    },
  };
}

export function createTestViewerMilestoneNotice(): ChatMessageType<
  'usernotice',
  'viewermilestone'
> {
  return createBaseViewerMilestoneNotice();
}

export function createTestPrimeSubNotice(
  months: number = 1,
): ChatMessageType<'usernotice', 'sub'> {
  return createBaseSubNotice('Prime', 'Prime', months);
}

export function createTestTier1SubNotice(
  months: number = 1,
): ChatMessageType<'usernotice', 'sub'> {
  return createBaseSubNotice('1000', 'Tier 1', months);
}

export function createTestTier2SubNotice(
  months: number = 1,
): ChatMessageType<'usernotice', 'sub'> {
  return createBaseSubNotice('2000', 'Tier 2', months);
}

export function createTestTier3SubNotice(
  months: number = 1,
): ChatMessageType<'usernotice', 'sub'> {
  return createBaseSubNotice('3000', 'Tier 3', months);
}

export function createTestSubNotice(): ChatMessageType<'usernotice', 'sub'> {
  return createTestPrimeSubNotice(1);
}

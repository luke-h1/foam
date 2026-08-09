/* eslint-disable camelcase */
import { render } from '@testing-library/react-native';

import type {
  AnyChatMessageType,
  ChatMessageType,
} from '@app/store/chat/types/constants';
import { parseIrcMessage } from '@app/utils/chat/ircProtocol/parseIrcMessage';
import { coerceUserNoticeTags } from '@app/utils/chat/messageHandlers/coerceUserNoticeTags';
import { createUserNoticeMessage } from '@app/utils/chat/messageHandlers/createUserNoticeMessage';

import { RichChatMessage } from '../components/ChatMessage/RichChatMessage';
import { getChatRowItemType } from '../util/chatRowItemType';

jest.mock('@app/utils/date-time/date', () => ({
  formatDate: jest.fn(() => '12:00'),
}));

jest.mock('@app/services/twitch-service');

function buildNoticeFromIrc(line: string): AnyChatMessageType {
  const parsed = parseIrcMessage(line);
  if (!parsed?.tags) {
    throw new Error(`Test line did not parse as an IRC message: ${line}`);
  }

  return createUserNoticeMessage({
    tags: coerceUserNoticeTags(parsed.tags),
    channelName: 'foam',
    text: parsed.params[1] ?? '',
    broadcasterId: 'broadcaster-1',
  });
}

function renderNoticeFromIrc(line: string) {
  const message = buildNoticeFromIrc(line);
  const rendered = render(
    <RichChatMessage {...(message as ChatMessageType<'usernotice'>)} />,
  );

  return { message, ...rendered };
}

const RESUB = String.raw`@badge-info=subscriber/27;badges=subscriber/24;color=#8A2BE2;display-name=Rexdain;id=resub-1;login=rexdain;mod=0;msg-id=resub;msg-param-cumulative-months=27;msg-param-months=0;msg-param-should-share-streak=0;msg-param-streak-months=0;msg-param-sub-plan-name=Channel\sSubscription;msg-param-sub-plan=2000;room-id=1;subscriber=1;system-msg=Rexdain\ssubscribed\sat\sTier\s1.\sThey've\ssubscribed\sfor\s27\smonths!;tmi-sent-ts=1700000000000;user-id=2;user-type= :tmi.twitch.tv USERNOTICE #foam :still here`;

const SUB = String.raw`@badges=;color=;display-name=NewSubscriber;id=sub-1;login=newsubscriber;msg-id=sub;msg-param-cumulative-months=1;msg-param-sub-plan=1000;room-id=1;system-msg=NewSubscriber\ssubscribed\swith\sPrime.;tmi-sent-ts=1700000000000;user-id=3 :tmi.twitch.tv USERNOTICE #foam :`;

const SUBGIFT = String.raw`@display-name=GiftGiver;id=subgift-1;login=giftgiver;msg-id=subgift;msg-param-gift-months=1;msg-param-months=3;msg-param-recipient-display-name=Lucky;msg-param-recipient-id=9;msg-param-recipient-user-name=lucky;msg-param-sub-plan=1000;room-id=1;system-msg=GiftGiver\sgifted\sa\sTier\s1\ssub\sto\sLucky!;tmi-sent-ts=1700000000000;user-id=4 :tmi.twitch.tv USERNOTICE #foam :`;

const SUBMYSTERYGIFT = String.raw`@display-name=MysteryGifter;id=mystery-1;login=mysterygifter;msg-id=submysterygift;msg-param-mass-gift-count=5;msg-param-sender-count=42;msg-param-sub-plan=1000;room-id=1;system-msg=MysteryGifter\sis\sgifting\s5\sTier\s1\sSubs!;tmi-sent-ts=1700000000000;user-id=5 :tmi.twitch.tv USERNOTICE #foam :`;

const WATCH_STREAK = String.raw`@badges=;color=#9146FF;display-name=Krankel;id=streak-1;login=krankel;msg-id=viewermilestone;msg-param-category=watch-streak;msg-param-copoReward=450;msg-param-id=abc;msg-param-value=25;room-id=1;system-msg=Krankel\sis\scurrently\son\sa\s25-stream\sstreak!;tmi-sent-ts=1700000000000;user-id=6 :tmi.twitch.tv USERNOTICE #foam :25 streams`;

const MOD_ANNIVERSARY = String.raw`@badges=moderator/1;color=#DAA520;display-name=Jimmotep;id=modiversary-1;login=jimmotep;mod=1;msg-id=modiversary;msg-param-months=18;room-id=1;system-msg=has\sbeen\sa\smoderator\sfor\s18\smonths!;tmi-sent-ts=1700000000000;user-id=7 :tmi.twitch.tv USERNOTICE #foam :I'm celebrating my 1 year, 6 month Mod Anniversary!`;

const RAID = String.raw`@display-name=RaidLeader;id=raid-1;login=raidleader;msg-id=raid;msg-param-displayName=RaidLeader;msg-param-login=raidleader;msg-param-viewerCount=500;room-id=1;system-msg=500\sraiders\sfrom\sRaidLeader\shave\sjoined!;tmi-sent-ts=1700000000000;user-id=8 :tmi.twitch.tv USERNOTICE #foam :`;

const UNRAID = String.raw`@display-name=RaidLeader;id=unraid-1;login=raidleader;msg-id=unraid;room-id=1;system-msg=The\sraid\shas\sbeen\scancelled.;tmi-sent-ts=1700000000000;user-id=8 :tmi.twitch.tv USERNOTICE #foam :`;

const ANNOUNCEMENT = String.raw`@display-name=Gekon;id=announcement-1;login=gekon;msg-id=announcement;msg-param-color=PRIMARY;room-id=1;system-msg=;tmi-sent-ts=1700000000000;user-id=10 :tmi.twitch.tv USERNOTICE #foam :read the rules`;

const CHARITY = String.raw`@display-name=Donor;id=charity-1;login=donor;msg-id=charitydonation;msg-param-charity-name=Cancer\sResearch;msg-param-donation-amount=1000;msg-param-donation-currency=USD;msg-param-exponent=2;room-id=1;system-msg=Donor\sdonated\s$10.00\sto\sCancer\sResearch;tmi-sent-ts=1700000000000;user-id=11 :tmi.twitch.tv USERNOTICE #foam :for a good cause`;

const RITUAL = String.raw`@display-name=Newbie;id=ritual-1;login=newbie;msg-id=ritual;msg-param-ritual-name=new_chatter;room-id=1;system-msg=Newbie\sis\snew\shere.\sSay\shello!;tmi-sent-ts=1700000000000;user-id=12 :tmi.twitch.tv USERNOTICE #foam :hi everyone`;

const BITS_BADGE = String.raw`@display-name=Cheerer;id=bits-1;login=cheerer;msg-id=bitsbadgetier;msg-param-threshold=1000;room-id=1;system-msg=Cheerer\sjust\searned\sa\snew\s1000\sBits\sbadge!;tmi-sent-ts=1700000000000;user-id=13 :tmi.twitch.tv USERNOTICE #foam :`;

const PRIME_UPGRADE = String.raw`@display-name=PrimeUser;id=prime-1;login=primeuser;msg-id=primepaidupgrade;msg-param-sub-plan=1000;room-id=1;system-msg=PrimeUser\sconverted\sfrom\sa\sPrime\ssub\sto\sa\sTier\s1\ssub!;tmi-sent-ts=1700000000000;user-id=14 :tmi.twitch.tv USERNOTICE #foam :`;

const ALL_NOTICES = [
  ['resub', RESUB],
  ['sub', SUB],
  ['subgift', SUBGIFT],
  ['submysterygift', SUBMYSTERYGIFT],
  ['viewermilestone', WATCH_STREAK],
  ['modiversary', MOD_ANNIVERSARY],
  ['raid', RAID],
  ['unraid', UNRAID],
  ['announcement', ANNOUNCEMENT],
  ['charitydonation', CHARITY],
  ['ritual', RITUAL],
  ['bitsbadgetier', BITS_BADGE],
  ['primepaidupgrade', PRIME_UPGRADE],
] as const;

function getRowText(instance: {
  props: { children?: unknown };
  children: (string | { props: { children?: unknown } })[];
}): string {
  return instance.children
    .map(child =>
      typeof child === 'string'
        ? child
        : getRowText(child as Parameters<typeof getRowText>[0]),
    )
    .join(' ');
}

describe('chat notice pipeline', () => {
  test.each(ALL_NOTICES)(
    'a %s notice never renders an empty row',
    (_msgId, line) => {
      const { getByTestId } = renderNoticeFromIrc(line);

      expect(getRowText(getByTestId('chat-message')).trim()).not.toBe('');
    },
  );

  test('a subscription notice names the subscriber, the tier and the months', () => {
    const { getByText } = renderNoticeFromIrc(RESUB);

    expect(getByText('Rexdain')).toBeOnTheScreen();
    expect(getByText('Subscribed with Tier 1.')).toBeOnTheScreen();
    expect(getByText('27 months')).toBeOnTheScreen();
    expect(getByText('still here')).toBeOnTheScreen();
  });

  test('a first-time sub renders without month copy', () => {
    const { getByText, queryByText } = renderNoticeFromIrc(SUB);

    expect(getByText('NewSubscriber')).toBeOnTheScreen();
    expect(getByText('Subscribed with Prime.')).toBeOnTheScreen();
    expect(queryByText(/months/)).toBeNull();
  });

  test('a gift sub names the recipient', () => {
    const { getByText } = renderNoticeFromIrc(SUBGIFT);

    expect(getByText('GiftGiver')).toBeOnTheScreen();
    expect(getByText('Lucky')).toBeOnTheScreen();
  });

  test('a community gift names the count', () => {
    const { getByText } = renderNoticeFromIrc(SUBMYSTERYGIFT);

    expect(getByText('MysteryGifter')).toBeOnTheScreen();
    expect(getByText('5')).toBeOnTheScreen();
  });

  test('a watch streak keeps both the streak line and what the viewer typed', () => {
    const { getByText } = renderNoticeFromIrc(WATCH_STREAK);

    expect(getByText('Watch streak')).toBeOnTheScreen();
    expect(getByText('Krankel')).toBeOnTheScreen();
    expect(getByText(' is currently on a 25-stream streak!')).toBeOnTheScreen();
    expect(getByText('25 streams')).toBeOnTheScreen();
  });

  test('a watch streak shows the channel points it earned', () => {
    const { getByText } = renderNoticeFromIrc(WATCH_STREAK);

    expect(getByText(' +450 points')).toBeOnTheScreen();
  });

  test('a mod anniversary names the moderator Twitch left out of system-msg', () => {
    const { getByText } = renderNoticeFromIrc(MOD_ANNIVERSARY);

    expect(getByText('Mod anniversary')).toBeOnTheScreen();
    expect(getByText('Jimmotep')).toBeOnTheScreen();
    expect(getByText(' has been a moderator for 18 months!')).toBeOnTheScreen();
    expect(
      getByText("I'm celebrating my 1 year, 6 month Mod Anniversary!"),
    ).toBeOnTheScreen();
  });

  test('a raid keeps the sentence Twitch wrote', () => {
    const { getByText } = renderNoticeFromIrc(RAID);

    expect(getByText('Raid')).toBeOnTheScreen();
    expect(
      getByText('500 raiders from RaidLeader have joined!'),
    ).toBeOnTheScreen();
  });

  test('an unraid is not prefixed with the broadcaster name', () => {
    const { getByText } = renderNoticeFromIrc(UNRAID);

    expect(getByText('Raid cancelled')).toBeOnTheScreen();
    expect(getByText('The raid has been cancelled.')).toBeOnTheScreen();
  });

  test('an announcement renders the broadcaster message', () => {
    const { getByText } = renderNoticeFromIrc(ANNOUNCEMENT);

    expect(getByText('read the rules')).toBeOnTheScreen();
  });

  test('a charity donation renders the amount and the charity', () => {
    const { getByText } = renderNoticeFromIrc(CHARITY);

    expect(getByText('Charity donation')).toBeOnTheScreen();
    expect(getByText('donated $10.00 to Cancer Research')).toBeOnTheScreen();
    expect(getByText('for a good cause')).toBeOnTheScreen();
  });

  test('a ritual renders the notice and what the chatter typed', () => {
    const { getByText } = renderNoticeFromIrc(RITUAL);

    expect(getByText('New chatter')).toBeOnTheScreen();
    expect(getByText('Newbie is new here. Say hello!')).toBeOnTheScreen();
    expect(getByText('hi everyone')).toBeOnTheScreen();
  });

  test('a bits badge tier renders the system line', () => {
    const { getByText } = renderNoticeFromIrc(BITS_BADGE);

    expect(
      getByText('Cheerer just earned a new 1000 Bits badge!'),
    ).toBeOnTheScreen();
  });

  describe('row identity', () => {
    test('each notice variant gets its own recycling identity', () => {
      const itemTypes = ALL_NOTICES.map(([, line]) =>
        getChatRowItemType(buildNoticeFromIrc(line)),
      );

      expect(itemTypes.every(itemType => itemType !== 'invalid')).toBe(true);
    });

    test('two notices of one variant split by how tall they render', () => {
      const bare = buildNoticeFromIrc(SUB);
      const wordy = buildNoticeFromIrc(
        `${RESUB} been here since the beginning and I am not going anywhere, thank you for every stream this year and the last`,
      );

      expect(getChatRowItemType(bare)).not.toBe(getChatRowItemType(wordy));
    });

    test('a row identity stays put across repeated reads', () => {
      const message = buildNoticeFromIrc(WATCH_STREAK);

      expect(getChatRowItemType(message)).toBe(getChatRowItemType(message));
    });
  });
});

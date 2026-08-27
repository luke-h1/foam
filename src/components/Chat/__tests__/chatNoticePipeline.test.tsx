/* eslint-disable camelcase */
import { render } from '@testing-library/react-native';

import { twitchService } from '@app/services/twitch-service';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { TwitchClip } from '@app/types/twitch/clip';
import { parseIrcMessage } from '@app/utils/chat/ircProtocol/parseIrcMessage';
import { coerceUserNoticeTags } from '@app/utils/chat/messageHandlers/coerceUserNoticeTags';
import { createUserNoticeMessage } from '@app/utils/chat/messageHandlers/createUserNoticeMessage';
import * as dateModule from '@app/utils/date-time/date';

import { RichChatMessage } from '../components/ChatMessage/RichChatMessage';
import { getChatRowItemType } from '../util/chatRowItemType';
import {
  ALL_NOTICES,
  ANNOUNCEMENT,
  BITS_BADGE,
  CHARITY,
  MOD_ANNIVERSARY,
  RAID,
  RESUB,
  RITUAL,
  SUB,
  SUBGIFT,
  SUBMYSTERYGIFT,
  UNRAID,
  WATCH_STREAK,
} from './__fixtures__/chatNoticePipeline.fixture';

jest.spyOn(dateModule, 'formatDate').mockReturnValue('12:00');

/**
 * Stub so a real fetch never fires. SAFETY: the resolved value is never read,
 * it only satisfies the return type.
 */
jest.spyOn(twitchService, 'getClip').mockResolvedValue({} as TwitchClip);

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
    <RichChatMessage<'usernotice', keyof UserNoticeVariantMap> {...message} />,
  );

  return { message, ...rendered };
}

interface RenderedRowNode {
  props: { children?: unknown };
  children: (string | RenderedRowNode)[];
}

function getRowText(instance: RenderedRowNode): string {
  return instance.children
    .map(child => (child instanceof Object ? getRowText(child) : child))
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

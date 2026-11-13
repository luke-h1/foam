import { twitchSanitisedChannelBadges } from '@app/services/__fixtures__/badges/twitch/twitch-sanitised-channel-badges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitch-sanitised-global-badges.fixture';
import { denseEmoteData } from '@app/store/chat/__fixtures__/resolveMessageEmoteTokens.perf.fixture';

export const PIPELINE_CHANNEL_ID = 'perf-channel';

export const pipelineEmoteData = {
  ...denseEmoteData,
  twitchGlobalBadges: twitchSanitisedGlobalBadges,
  twitchChannelBadges: twitchSanitisedChannelBadges,
};

const CHATTER_COUNT = 40;

const toRawBadge = (badge: { set: string; id: string } | undefined) =>
  badge ? [`${badge.set}/${badge.id.split('_').pop()}`] : [];

const chatterBadges = Array.from({ length: CHATTER_COUNT }, (_, index) =>
  [
    twitchSanitisedGlobalBadges[index % twitchSanitisedGlobalBadges.length],
    twitchSanitisedChannelBadges[index % twitchSanitisedChannelBadges.length],
  ]
    .flatMap(toRawBadge)
    .join(','),
);

/**
 * A spam-heavy mix: a small pool of lines repeats across chatters, the way a
 * hype moment or a raid does, plus a mention and a link in some lines.
 */
const textPool = Array.from({ length: 24 }, (_, index) => {
  const bttv = denseEmoteData.bttvChannelEmotes[index % 12]?.name ?? 'BTTV0';

  const twitch =
    denseEmoteData.twitchGlobalEmotes[index % 8]?.name ?? 'Twitch1';

  if (index % 6 === 0) {
    return `@viewer${index} ${bttv} look at this https://example.com/${index}`;
  }

  return index % 2 === 0
    ? `${bttv} ${bttv} ${twitch}`
    : `${twitch} hype ${bttv}`;
});

function createPrivmsgLine(lineIndex: number): string {
  const chatter = lineIndex % CHATTER_COUNT;
  const login = `viewer${chatter}`;
  const text = textPool[(lineIndex * 7) % textPool.length];

  const tags = [
    'badge-info=',
    `badges=${chatterBadges[chatter]}`,
    `color=#${(chatter * 99_991).toString(16).padStart(6, '0').slice(0, 6)}`,
    `display-name=Viewer${chatter}`,
    'emotes=',
    `id=pipeline-${lineIndex}`,
    'mod=0',
    `room-id=${PIPELINE_CHANNEL_ID}`,
    'subscriber=1',
    `tmi-sent-ts=${1_700_000_000_000 + lineIndex}`,
    `user-id=uid-${chatter}`,
    'user-type=',
  ].join(';');

  return `@${tags} :${login}!${login}@${login}.tmi.twitch.tv PRIVMSG #perfchannel :${text}`;
}

const createLineBatch = (start: number, count: number): string =>
  Array.from(
    { length: count },
    (_, offset) => `${createPrivmsgLine(start + offset)}\r\n`,
  ).join('');

/**
 * Two flushes of 120 lines. The second one fills past the 150-row window,
 * so the store front-trims on commit the way a busy channel does.
 */
export const pipelineLineBatches = [
  createLineBatch(0, 120),
  createLineBatch(120, 120),
];

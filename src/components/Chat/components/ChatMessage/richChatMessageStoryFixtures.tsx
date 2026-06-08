/* eslint-disable camelcase */
import { ffzSanitiisedChannelBadges } from '@app/services/__fixtures__/badges/ffz/ffzSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';
import { chatterinoService } from '@app/services/chatterino-service';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { ReactNode } from 'react';
import { View, ScrollView } from 'react-native';

function requireFixture<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(label);
  }

  return value;
}

export const stvGlobalEmote1 = requireFixture(
  seventvSanitiisedGlobalEmoteSetFixture[0],
  '7TV global emote 1 fixture is missing',
);
export const stvGlobalEmote2 = requireFixture(
  seventvSanitiisedGlobalEmoteSetFixture[1],
  '7TV global emote 2 fixture is missing',
);
export const stvGlobalBaseEmote = requireFixture(
  seventvSanitiisedGlobalEmoteSetFixture.find(emote => !emote.zero_width),
  '7TV base emote fixture is missing',
);
export const stvChannelEmote1 = requireFixture(
  sevenTvSanitisedChannelEmoteSetFixture[0],
  '7TV channel emote fixture is missing',
);

export const createBaseMessage = (
  message: ParsedPart[],
  userstate: Partial<UserStateTags> = {},
  badges: SanitisedBadgeSet[] = [],
): ChatMessageType<'userstate'> => {
  const message_id = 'msg-123';
  const message_nonce = 'nonce-123';
  return {
    id: `${message_id}_${message_nonce}`,
    userstate: {
      username: 'testuser',
      'display-name': 'TestUser',
      login: 'testuser',
      color: '#FF0000',
      'user-id': '123456',
      ...userstate,
    } as UserStateTags,
    message,
    badges,
    channel: 'testchannel',
    message_id,
    message_nonce,
    sender: 'testuser',
    replyDisplayName: '',
    replyBody: '',
  };
};

const subscriberBadge = requireFixture(
  twitchSanitisedGlobalBadges.find(badge => badge.id === 'subscriber_0'),
  'subscriber badge fixture is missing',
);
export const premiumBadge = requireFixture(
  twitchSanitisedGlobalBadges.find(badge => badge.id === 'premium_1'),
  'premium badge fixture is missing',
);
export const moderatorBadge = requireFixture(
  twitchSanitisedGlobalBadges.find(badge => badge.id === 'moderator_1'),
  'moderator badge fixture is missing',
);
export const broadcasterBadge = requireFixture(
  twitchSanitisedGlobalBadges.find(badge => badge.id === 'broadcaster_1'),
  'broadcaster badge fixture is missing',
);

export const mockBadges: SanitisedBadgeSet[] = [subscriberBadge, premiumBadge];
export const mockModBadges: SanitisedBadgeSet[] = [moderatorBadge];

export const ffzVipBadge = requireFixture(
  ffzSanitiisedChannelBadges.find(badge => badge.id === 'vip_badge'),
  'FFZ VIP badge fixture is missing',
);
export const ffzModBadge = requireFixture(
  ffzSanitiisedChannelBadges.find(badge => badge.id === 'mod_badge'),
  'FFZ mod badge fixture is missing',
);
export const chatterinoBadge = requireFixture(
  chatterinoService.listSanitisedBadges()[0],
  'Chatterino badge fixture is missing',
);

export const chatStoryDecorator = (Story: () => ReactNode) => (
  <ScrollView
    style={{
      flex: 1,
      backgroundColor: '#0E0E10',
      padding: 8,
    }}
  >
    <View style={{ maxWidth: 520, width: '100%' }}>
      <Story />
    </View>
  </ScrollView>
);

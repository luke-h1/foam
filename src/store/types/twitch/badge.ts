import { components } from './generated';

export type TwitchBadgesResponse =
  components['schemas']['GetGlobalChatBadgesResponse'];

export type TwitchBadgeVersion =
  components['schemas']['ChatBadge']['versions'][number];

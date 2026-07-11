import type {
  AnnouncementTags,
  AnonGiftPaidUpgradeTags,
  BaseUserNoticeTags,
  BitsBadgeTierTags,
  CharityDonationTags,
  ExtendSubTags,
  GiftPaidUpgradeTags,
  HighlightedMessageTags,
  ModiversaryTags,
  PayForwardTags,
  PrimePaidUpgradeTags,
  RaidTags,
  RewardGiftTags,
  RitualTags,
  SharedChatNoticeTags,
  SubGiftTags,
  SubMysteryGiftTags,
  SubscriptionTags,
  UnraidTags,
  ViewerMilestoneTags,
} from '../usernotice';

function createBaseUserNoticeTags(
  overrides: Partial<BaseUserNoticeTags> = {},
): BaseUserNoticeTags {
  return {
    'msg-id': 'sub',
    'display-name': 'TestUser',
    login: 'testuser',
    color: '#9146FF',
    badges: '',
    'badge-info': '',
    emotes: '',
    flags: '',
    mod: '',
    'user-id': '12345',
    'user-type': '',
    ...overrides,
  };
}

export function createViewerMilestoneTags(
  overrides: Partial<ViewerMilestoneTags> = {},
): ViewerMilestoneTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'MilestoneUser',
      login: 'milestoneuser',
      'system-msg': 'MilestoneUser watched 5 consecutive streams',
      color: '#1AC9A2',
    }),
    'msg-id': 'viewermilestone',
    'msg-param-category': 'watch-streak',
    'msg-param-copoReward': '450',
    'msg-param-id': '1',
    'msg-param-value': '5',
    ...overrides,
  };
}

export function createSubscriptionTags(
  overrides: Partial<SubscriptionTags> = {},
): SubscriptionTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'SubUser',
      login: 'subuser',
      'system-msg': 'SubUser subscribed with Tier 1',
      color: '#0000FF',
    }),
    'msg-id': 'sub',
    'msg-param-cumulative-months': '1',
    'msg-param-should-share-streak': '0',
    'msg-param-streak-months': '0',
    'msg-param-sub-plan': '2000',
    'msg-param-sub-plan-name': 'Tier 1',
    ...overrides,
  };
}

export function createResubTags(
  overrides: Partial<SubscriptionTags> = {},
): SubscriptionTags {
  return createSubscriptionTags({
    'msg-id': 'resub',
    'msg-param-cumulative-months': '12',
    'display-name': 'ResubUser',
    login: 'resubuser',
    'system-msg': 'ResubUser resubscribed for 12 months',
    color: '#FF00FF',
    ...overrides,
  });
}

export function createSubGiftTags(
  overrides: Partial<SubGiftTags> = {},
): SubGiftTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'GiftGiver',
      login: 'giftgiver',
      'system-msg': 'GiftGiver gifted a subscription to GiftRecipient',
      color: '#FFFF00',
    }),
    'msg-id': 'subgift',
    'msg-param-gift-months': '1',
    'msg-param-recipient-user-name': 'giftrecipient',
    'msg-param-recipient-display-name': 'GiftRecipient',
    'msg-param-recipient-id': '67890',
    'msg-param-months': '1',
    'msg-param-sub-plan': '2000',
    ...overrides,
  };
}

export function createRaidTags(overrides: Partial<RaidTags> = {}): RaidTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'RaidLeader',
      login: 'raidleader',
      'system-msg': '500 raiders from RaidLeader have joined!',
      color: '#00FFFF',
    }),
    'msg-id': 'raid',
    'msg-param-displayName': 'RaidLeader',
    'msg-param-login': 'raidleader',
    'msg-param-viewerCount': '500',
    ...overrides,
  };
}

export function createAnonGiftPaidUpgradeTags(
  overrides: Partial<AnonGiftPaidUpgradeTags> = {},
): AnonGiftPaidUpgradeTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'UpgradeUser',
      login: 'upgradeuser',
      'system-msg': 'UpgradeUser is continuing the gift sub',
      color: '#FF8800',
    }),
    'msg-id': 'anongiftpaidupgrade',
    'msg-param-promo-name': 'SummerPromo',
    'msg-param-promo-gift-total': '10',
    ...overrides,
  };
}

export function createSubMysteryGiftTags(
  overrides: Partial<SubMysteryGiftTags> = {},
): SubMysteryGiftTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'MysteryGifter',
      login: 'mysterygifter',
      'system-msg': 'MysteryGifter gifted 5 Tier 1 Subs to the community!',
      color: '#33CC99',
    }),
    'msg-id': 'submysterygift',
    'msg-param-mass-gift-count': '5',
    'msg-param-sender-count': '42',
    'msg-param-sub-plan': '2000',
    ...overrides,
  };
}

export function createGiftPaidUpgradeTags(
  overrides: Partial<GiftPaidUpgradeTags> = {},
): GiftPaidUpgradeTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'UpgradeUser',
      login: 'upgradeuser',
      'system-msg':
        'UpgradeUser is continuing the gift sub they got from GiftSender!',
      color: '#FF8800',
    }),
    'msg-id': 'giftpaidupgrade',
    'msg-param-sender-login': 'gifterlogin',
    'msg-param-sender-name': 'GiftSender',
    'msg-param-promo-name': 'Subtember',
    'msg-param-promo-gift-total': '12',
    ...overrides,
  };
}

export function createRewardGiftTags(
  overrides: Partial<RewardGiftTags> = {},
): RewardGiftTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'RewardUser',
      login: 'rewarduser',
      'system-msg': 'RewardUser redeemed Hydrate',
      color: '#9146FF',
      'room-id': '67890',
      'custom-reward-id': 'reward-123',
      'msg-param-reward-title': 'Hydrate',
    }),
    'msg-id': 'rewardgift',
    ...overrides,
  };
}

export function createBitsBadgeTierTags(
  overrides: Partial<BitsBadgeTierTags> = {},
): BitsBadgeTierTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'Cheerer',
      login: 'cheerer',
      'system-msg': 'Cheerer earned the 1,000 Bits badge!',
    }),
    'msg-id': 'bitsbadgetier',
    'msg-param-threshold': '1000',
    ...overrides,
  };
}

export function createUnraidTags(
  overrides: Partial<UnraidTags> = {},
): UnraidTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'Streamer',
      login: 'streamer',
      'system-msg': 'The raid has been cancelled.',
    }),
    'msg-id': 'unraid',
    ...overrides,
  };
}

export function createSharedChatNoticeTags(
  overrides: Partial<SharedChatNoticeTags> = {},
): SharedChatNoticeTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'Streamer',
      login: 'streamer',
      'system-msg': 'Shared chat connected with partner channel.',
    }),
    'msg-id': 'sharedchatnotice',
    ...overrides,
  };
}

export function createModiversaryTags(
  overrides: Partial<ModiversaryTags> = {},
): ModiversaryTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'ModUser',
      login: 'moduser',
      // Post-parse form: tags are IRCv3-unescaped in parseIrcTags before
      // handlers ever see them (the parser is the single decode point).
      'system-msg': 'ModUser is celebrating 24 months as a moderator!',
    }),
    'msg-id': 'modiversary',
    'msg-param-months': '24',
    ...overrides,
  };
}

export function createCharityDonationTags(
  overrides: Partial<CharityDonationTags> = {},
): CharityDonationTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'Donor',
      login: 'donor',
      'system-msg': 'Donor donated $10.00 to Charity Name',
    }),
    'msg-id': 'charitydonation',
    'msg-param-charity-name': 'Charity Name',
    'msg-param-donation-amount': '1000',
    'msg-param-donation-currency': 'USD',
    'msg-param-exponent': '2',
    ...overrides,
  };
}

export function createRitualTags(
  overrides: Partial<RitualTags> = {},
): RitualTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'Viewer',
      login: 'viewer',
      'system-msg': 'Viewer performed the ritual',
    }),
    'msg-id': 'ritual',
    'msg-param-ritual-name': 'new_chatter',
    ...overrides,
  };
}

export function createPrimePaidUpgradeTags(
  overrides: Partial<PrimePaidUpgradeTags> = {},
): PrimePaidUpgradeTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'PrimeUser',
      login: 'primeuser',
      'system-msg': 'PrimeUser upgraded their Prime subscription',
    }),
    'msg-id': 'primepaidupgrade',
    'msg-param-sub-plan': 'Prime',
    'msg-param-sub-plan-name': 'Prime',
    'msg-param-cumulative-months': '3',
    ...overrides,
  };
}

export function createExtendSubTags(
  overrides: Partial<ExtendSubTags> = {},
): ExtendSubTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'ExtendUser',
      login: 'extenduser',
      'system-msg': 'ExtendUser extended their subscription',
    }),
    'msg-id': 'extendsub',
    'msg-param-sub-plan': '2000',
    'msg-param-sub-plan-name': 'Tier 1',
    'msg-param-cumulative-months': '6',
    'msg-param-streak-months': '3',
    'msg-param-should-share-streak': '1',
    ...overrides,
  };
}

export function createPayForwardTags(
  overrides: Partial<PayForwardTags> = {},
): PayForwardTags {
  return {
    ...createBaseUserNoticeTags({
      'display-name': 'ForwardUser',
      login: 'forwarduser',
      'system-msg': 'ForwardUser paid forward a subscription',
    }),
    'msg-id': 'standardpayforward',
    'msg-param-sub-plan': '2000',
    'msg-param-sub-plan-name': 'Tier 1',
    'msg-param-recipient-display-name': 'Recipient',
    'msg-param-recipient-user-name': 'recipient',
    'msg-param-months': '1',
    ...overrides,
  };
}

export function createAnnouncementTags(
  overrides: Partial<AnnouncementTags> = {},
): AnnouncementTags {
  return {
    ...createBaseUserNoticeTags({
      id: '55d90904-e515-47d0-ac1d-879f7f1d7b01',
      'tmi-sent-ts': '1648758023469',
      'display-name': 'Gekon',
      login: 'gekon',
      color: '#FF5500',
      badges: 'broadcaster/1',
      mod: '1',
      'user-type': 'mod',
    }),
    'msg-id': 'announcement',
    'msg-param-color': 'PRIMARY',
    ...overrides,
  };
}

export function createHighlightedMessageTags(
  overrides: Partial<HighlightedMessageTags> = {},
): HighlightedMessageTags {
  return {
    ...createBaseUserNoticeTags({
      id: 'highlight-id',
      'display-name': 'HighlightedUser',
      login: 'highlighteduser',
      color: '#FF5500',
      badges: 'subscriber/12',
      mod: '0',
    }),
    'msg-id': 'highlighted-message',
    ...overrides,
  };
}

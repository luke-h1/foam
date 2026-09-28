import type { SanitisedEmote } from '@app/types/emote';

export type TwitchNoticeKind =
  | 'viewermilestone'
  | 'sub'
  | 'resub'
  | 'anongift'
  | 'submysterygift'
  | 'giftpaidupgrade'
  | 'anongiftpaidupgrade'
  | 'primepaidupgrade'
  | 'charitydonation'
  | 'ritual'
  | 'modiversary';

export type MessageTokenKind =
  | 'text'
  | 'emote'
  | 'mention'
  | 'stvEmoteLink'
  | 'twitchClip'
  | 'link'
  | 'cheermote'
  | 'stvEmoteAdded'
  | 'stvEmoteRemoved'
  | TwitchNoticeKind;

export type MediaLinkTokenKind = Extract<
  MessageTokenKind,
  'stvEmoteLink' | 'twitchClip'
>;

/**
 * The emote metadata an emote token carries. Every field is optional because a
 * token is built before its emote is resolved, and enrichment fills it in later.
 */
type EmotePartFields = Pick<
  Partial<SanitisedEmote>,
  | 'creator'
  | 'emote_link'
  | 'image_variants'
  | 'original_name'
  | 'provider'
  | 'site'
  | 'static_url'
  | 'url'
> & {
  id?: string;
  name?: string;
  flags?: number;
  color?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  zero_width?: boolean;

  /**
   * Zero-width emotes rendered centered on top of this emote instead of as
   * standalone tokens.
   */
  overlaid?: MessageToken<'emote'>[];

  thumbnail?: string;
};

interface SubscriptionEventBase {
  displayName: string;
  message?: string;
}

/**
 * Every token shape, keyed by its `type` discriminant. `MessageToken<K>` is a
 * lookup into this map, so `MessageToken` narrows on `token.type` the way a
 * discriminated union should.
 */
interface MessageTokenByKind {
  text: { type: 'text'; content: string };
  mention: { type: 'mention'; content: string; color?: string };
  link: { type: 'link'; content: string; url?: string };

  stvEmoteLink: {
    type: 'stvEmoteLink';
    content: string;
    url?: string;
    thumbnail?: string;
  };
  twitchClip: {
    type: 'twitchClip';
    content: string;
    url?: string;
    thumbnail?: string;
  };

  emote: { type: 'emote'; content: string } & EmotePartFields;

  cheermote: {
    type: 'cheermote';
    content: string;
    cheermote: {
      bits: number;
      color: string;
      prefix: string;
      static_url: string;
      url: string;
    };
  };

  stvEmoteAdded: {
    type: 'stvEmoteAdded';
    stvEvents: { type: 'added' | 'removed'; data: SanitisedEmote };
  };
  stvEmoteRemoved: {
    type: 'stvEmoteRemoved';
    stvEvents: { type: 'added' | 'removed'; data: SanitisedEmote };
  };

  sub: {
    type: 'sub';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'sub';
      plan: string;
      planName?: string; // Prime, Tier 1, Tier 2, Tier 3
      months?: number; // cumulative-months
      streakMonths?: number; // streak-months
      shouldShareStreak?: boolean; // should-share-streak
    };
  };
  resub: {
    type: 'resub';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'resub' | 'extendsub' | 'standardpayforward';
      plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
      planName?: string;
      months: number;
      streakMonths?: number;
      shouldShareStreak?: boolean;
    };
  };
  anongift: {
    type: 'anongift';
    subscriptionEvent: SubscriptionEventBase & {
      msgId:
        | 'subgift'
        | 'anonsubgift'
        | 'communitypayforward'
        | 'primecommunitygiftreceived';
      plan: string;
      planName?: string;
      recipientDisplayName: string; // recipient-display-name
      recipientId: string; // recipient-id
      giftMonths: number; // gift-months
      months: number;
    };
  };
  submysterygift: {
    type: 'submysterygift';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'submysterygift' | 'anonsubmysterygift';
      plan?: string;
      planName?: string;
      massGiftCount?: number;
      senderCount?: number;
    };
  };
  giftpaidupgrade: {
    type: 'giftpaidupgrade';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'giftpaidupgrade';
      senderLogin?: string;
      senderName?: string;
      promoName?: string;
      promoGiftTotal?: string;
    };
  };
  anongiftpaidupgrade: {
    type: 'anongiftpaidupgrade';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'anongiftpaidupgrade';
      promoName: string;
      promoGiftTotal: string;
    };
  };
  primepaidupgrade: {
    type: 'primepaidupgrade';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'primepaidupgrade';
      plan: string;
      planName?: string;
      months?: number;
    };
  };

  charitydonation: {
    type: 'charitydonation';
    displayName: string;
    charityName: string;
    amount: string;
    currency: string;
    systemMsg: string;
    message?: string;
  };
  ritual: {
    type: 'ritual';
    displayName: string;
    ritualName: string;
    systemMsg: string;
    message?: string;
  };
  viewermilestone: {
    type: 'viewermilestone';
    category: string;
    reward: string;
    value: string;
    content: string;
    // "LimeTitanTV\\swatched\\s20\\sconsecutive\\sstreams..."
    systemMsg: string;
    login: string;
    displayName: string;
  };
  modiversary: {
    type: 'modiversary';
    months: string;
    systemMsg: string;
    content: string;
    login: string;
    displayName: string;
  };
}

export type MessageToken<TType extends MessageTokenKind = MessageTokenKind> =
  MessageTokenByKind[TType];

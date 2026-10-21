import type { SanitisedEmote } from '@app/types/emote';
import type { EoptOptional, PartialUndefined } from '@app/types/eopt';

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
  | 'gif'
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
  PartialUndefined<SanitisedEmote>,
  | 'creator'
  | 'emote_link'
  | 'image_variants'
  | 'original_name'
  | 'provider'
  | 'site'
  | 'static_url'
  | 'url'
> & {
  id?: EoptOptional<string>;
  name?: EoptOptional<string>;
  flags?: EoptOptional<number>;
  color?: EoptOptional<string>;
  width?: EoptOptional<number>;
  height?: EoptOptional<number>;
  aspect_ratio?: EoptOptional<number>;
  zero_width?: EoptOptional<boolean>;

  /**
   * Zero-width emotes rendered centered on top of this emote instead of as
   * standalone tokens.
   */
  overlaid?: EoptOptional<MessageToken<'emote'>[]>;

  thumbnail?: EoptOptional<string>;
};

interface SubscriptionEventBase {
  displayName: string;
  message?: EoptOptional<string>;
}

/**
 * Every token shape, keyed by its `type` discriminant. `MessageToken<K>` is a
 * lookup into this map, so `MessageToken` narrows on `token.type` the way a
 * discriminated union should.
 */
interface MessageTokenByKind {
  text: { type: 'text'; content: string };
  mention: {
    type: 'mention';
    content: string;
    color?: EoptOptional<string>;
  };
  link: {
    type: 'link';
    content: string;
    url?: EoptOptional<string>;
  };

  stvEmoteLink: {
    type: 'stvEmoteLink';
    content: string;
    url?: EoptOptional<string>;
    thumbnail?: EoptOptional<string>;
  };
  twitchClip: {
    type: 'twitchClip';
    content: string;
    url?: EoptOptional<string>;
    thumbnail?: EoptOptional<string>;
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
  gif: {
    type: 'gif';
    content: string;
    gifId: string;
    url: string;
  };

  sub: {
    type: 'sub';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'sub';
      plan: string;
      planName?: EoptOptional<string>; // Prime, Tier 1, Tier 2, Tier 3
      months?: EoptOptional<number>; // cumulative-months
      streakMonths?: EoptOptional<number>; // streak-months
      shouldShareStreak?: EoptOptional<boolean>; // should-share-streak
    };
  };
  resub: {
    type: 'resub';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'resub' | 'extendsub' | 'standardpayforward';
      plan: string; // 'Prime', '1000', '2000' or '3000' (Tier 1 to Tier 3)
      planName?: EoptOptional<string>;
      months: number;
      streakMonths?: EoptOptional<number>;
      shouldShareStreak?: EoptOptional<boolean>;
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
      planName?: EoptOptional<string>;
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
      plan?: EoptOptional<string>;
      planName?: EoptOptional<string>;
      massGiftCount?: EoptOptional<number>;
      senderCount?: EoptOptional<number>;
    };
  };
  giftpaidupgrade: {
    type: 'giftpaidupgrade';
    subscriptionEvent: SubscriptionEventBase & {
      msgId: 'giftpaidupgrade';
      senderLogin?: EoptOptional<string>;
      senderName?: EoptOptional<string>;
      promoName?: EoptOptional<string>;
      promoGiftTotal?: EoptOptional<string>;
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
      planName?: EoptOptional<string>;
      months?: EoptOptional<number>;
    };
  };

  charitydonation: {
    type: 'charitydonation';
    displayName: string;
    charityName: string;
    amount: string;
    currency: string;
    systemMsg: string;
    message?: EoptOptional<string>;
  };
  ritual: {
    type: 'ritual';
    displayName: string;
    ritualName: string;
    systemMsg: string;
    message?: EoptOptional<string>;
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

import type { SanitisedEmote } from '@app/types/emote';

export type TwitchNotices =
  | 'viewermilestone'
  | 'sub'
  | 'resub'
  | 'subgift'
  | 'anongift'
  | 'submysterygift'
  | 'giftpaidupgrade'
  | 'rewardgift'
  | 'anongiftpaidupgrade'
  | 'primepaidupgrade'
  | 'charitydonation'
  | 'ritual'
  | 'raid'
  | 'unraid'
  | 'sharedchatnotice';

export type PartVariant =
  | 'text'
  /**
   * Emoji i.e. a normal unicode emoji 🚀
   */
  | 'emote'
  /**
   * Mention i.e. @username
   */
  | 'mention'
  | 'stvEmote'
  | 'twitchClip'
  /**
   * Generic http(s) URL
   */
  | 'link'
  | 'notice'
  /**
   * Bits cheer token, e.g. Cheer100
   */
  | 'cheermote'
  | 'stv_emote_added'
  | 'stv_emote_removed'
  | TwitchNotices;

export type TwitchAnd7TVVariant = Extract<
  PartVariant,
  'stvEmote' | 'twitchClip'
>;

export type ParsedPart<TType extends PartVariant = PartVariant> = TType extends
  'stv_emote_added' | 'stv_emote_removed'
  ? {
      type: TType;
      stvEvents: {
        type: 'added' | 'removed';
        data: SanitisedEmote;
      };
    }
  : TType extends 'sub'
    ? {
        type: TType;
        subscriptionEvent: {
          msgId: 'sub';
          displayName: string;
          message?: string;
          plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
          planName?: string; // Prime, Tier 1, Tier 2, Tier 3
          months?: number; // cumulative-months
          streakMonths?: number; // streak-months
          shouldShareStreak?: boolean; // should-share-streak
        };
      }
    : TType extends 'resub'
      ? {
          type: TType;
          subscriptionEvent: {
            msgId: 'resub' | 'extendsub' | 'standardpayforward';
            displayName: string;
            message?: string;
            plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
            planName?: string; // Prime, Tier 1, Tier 2, Tier 3
            months: number; // cumulative-months
            streakMonths?: number; // streak-months
            shouldShareStreak?: boolean; // should-share-streak
          };
        }
      : TType extends 'anongift'
        ? {
            type: TType;
            subscriptionEvent: {
              msgId:
                | 'subgift'
                | 'anonsubgift'
                | 'communitypayforward'
                | 'primecommunitygiftreceived';
              displayName: string;
              message?: string;
              plan: string; // 1000, 2000, 3000 for Prime, Tier 1, Tier 2, Tier 3
              planName?: string; // Prime, Tier 1, Tier 2, Tier 3
              recipientDisplayName: string; // recipient-display-name
              recipientId: string; // recipient-id
              giftMonths: number; // gift-months
              months: number; // months
            };
          }
        : TType extends 'submysterygift'
          ? {
              type: TType;
              subscriptionEvent: {
                msgId: 'submysterygift' | 'anonsubmysterygift';
                displayName: string;
                message?: string;
                plan?: string;
                planName?: string;
                massGiftCount?: number;
                senderCount?: number;
              };
            }
          : TType extends 'giftpaidupgrade'
            ? {
                type: TType;
                subscriptionEvent: {
                  msgId: 'giftpaidupgrade';
                  displayName: string;
                  message?: string;
                  senderLogin?: string;
                  senderName?: string;
                  promoName?: string;
                  promoGiftTotal?: string;
                };
              }
            : TType extends 'anongiftpaidupgrade'
              ? {
                  type: TType;
                  subscriptionEvent: {
                    msgId: 'anongiftpaidupgrade';
                    displayName: string;
                    message?: string;
                    promoName: string;
                    promoGiftTotal: string;
                  };
                }
              : TType extends 'primepaidupgrade'
                ? {
                    type: TType;
                    subscriptionEvent: {
                      msgId: 'primepaidupgrade';
                      displayName: string;
                      message?: string;
                      plan: string;
                      planName?: string;
                      months?: number;
                    };
                  }
                : TType extends 'charitydonation'
                  ? {
                      type: TType;
                      displayName: string;
                      charityName: string;
                      amount: string;
                      currency: string;
                      systemMsg: string;
                      message?: string;
                    }
                  : TType extends 'ritual'
                    ? {
                        type: TType;
                        displayName: string;
                        ritualName: string;
                        systemMsg: string;
                        message?: string;
                      }
                    : TType extends 'viewermilestone'
                      ? {
                          type: TType;
                          category: string;
                          reward: string;
                          value: string;
                          content: string;
                          systemMsg: string; //"LimeTitanTV\\swatched\\s20\\sconsecutive\\sstreams\\sand\\ssparked\\sa\\swatch\\sstreak!",
                          login: string;
                          displayName: string;
                        }
                      : TType extends 'cheermote'
                        ? {
                            type: TType;
                            /**
                             * The original cheer token, e.g. "Cheer100".
                             */
                            content: string;
                            cheermote: {
                              bits: number;
                              color: string;
                              prefix: string;
                              static_url: string;
                              url: string;
                            };
                          }
                        : /**
                           * Normal message
                           */
                          Pick<
                            Partial<SanitisedEmote>,
                            | 'creator'
                            | 'emote_link'
                            | 'image_variants'
                            | 'original_name'
                            | 'site'
                            | 'static_url'
                            | 'url'
                          > & {
                            id?: string;
                            name?: string;
                            flags?: number;
                            type: TType;
                            content: string;
                            color?: string;
                            width?: number;
                            height?: number;
                            aspect_ratio?: number;
                            zero_width?: boolean;

                            /**
                             * Zero-width emotes stacked over this emote;
                             * rendered centered on top of it instead of as
                             * standalone parts.
                             */
                            overlaid?: ParsedPart<'emote'>[];

                            /**
                             * Used for emote and twitch clip previews
                             */
                            thumbnail?: string;
                          };

import type { MessageToken } from '@app/utils/chat/message-token';

export const text = (content: string): MessageToken => ({
  type: 'text',
  content,
});

export const mention = (content: string): MessageToken => ({
  type: 'mention',
  content,
});

export const link = (content: string): MessageToken => ({
  type: 'link',
  content,
});

export const emote = (
  name: string,
  zeroWidth = false,
): MessageToken<'emote'> => ({
  type: 'emote',
  content: name,
  name,
  zero_width: zeroWidth,
});

export const ritual = (): MessageToken => ({
  type: 'ritual',
  displayName: 'forsen',
  ritualName: 'new_chatter',
  systemMsg: 'forsen is new here',
});

export const subscription = (): MessageToken => ({
  type: 'sub',
  subscriptionEvent: {
    msgId: 'sub',
    displayName: 'forsen',
    plan: '1000',
  },
});

export const charityDonation = (): MessageToken => ({
  type: 'charitydonation',
  displayName: 'forsen',
  charityName: 'Save the Kappa',
  amount: '500',
  currency: 'USD',
  systemMsg: 'forsen donated $5.00',
});

export const stvEmoteEvent = (): MessageToken<'stvEmoteAdded'> => ({
  type: 'stvEmoteAdded',
  stvEvents: {
    type: 'added',
    data: {
      id: '123',
      name: 'FeelsDankMan',
      url: 'https://example.com/dank.png',
      original_name: 'FeelsDankMan',
      site: 'BTTV',
      provider: 'bttv',
      creator: null,
      emote_link: '',
      width: 32,
      height: 32,
    },
  },
});

export const viewerMilestone = (): MessageToken => ({
  type: 'viewermilestone',
  category: 'watch-streak',
  reward: '',
  value: '20',
  content: '',
  systemMsg: 'forsen watched 20 consecutive streams',
  login: 'forsen',
  displayName: 'forsen',
});

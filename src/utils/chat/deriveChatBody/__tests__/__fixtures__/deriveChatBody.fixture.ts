import type { ParsedPart } from '@app/utils/chat/parsedPart';

export const text = (content: string): ParsedPart => ({
  type: 'text',
  content,
});
export const mention = (content: string): ParsedPart => ({
  type: 'mention',
  content,
});
export const link = (content: string): ParsedPart => ({
  type: 'link',
  content,
});
export const emote = (
  name: string,
  zeroWidth = false,
): ParsedPart<'emote'> => ({
  type: 'emote',
  content: name,
  name,
  zero_width: zeroWidth,
});
export const ritual = (): ParsedPart => ({
  type: 'ritual',
  displayName: 'forsen',
  ritualName: 'new_chatter',
  systemMsg: 'forsen is new here',
});
export const raid = (): ParsedPart => ({
  type: 'raid',
  content: 'forsen is raiding with a party of 100',
});
export const subscription = (): ParsedPart => ({
  type: 'sub',
  subscriptionEvent: {
    msgId: 'sub',
    displayName: 'forsen',
    plan: '1000',
  },
});
export const charityDonation = (): ParsedPart => ({
  type: 'charitydonation',
  displayName: 'forsen',
  charityName: 'Save the Kappa',
  amount: '500',
  currency: 'USD',
  systemMsg: 'forsen donated $5.00',
});
export const stvEmoteEvent = (): ParsedPart<'stv_emote_added'> => ({
  type: 'stv_emote_added',
  stvEvents: {
    type: 'added',
    data: {
      id: '123',
      name: 'FeelsDankMan',
      url: 'https://example.com/dank.png',
      original_name: 'FeelsDankMan',
      site: 'BTTV',
      creator: null,
      emote_link: '',
      width: 32,
      height: 32,
    },
  },
});
export const viewerMilestone = (): ParsedPart => ({
  type: 'viewermilestone',
  category: 'watch-streak',
  reward: '',
  value: '20',
  content: '',
  systemMsg: 'forsen watched 20 consecutive streams',
  login: 'forsen',
  displayName: 'forsen',
});

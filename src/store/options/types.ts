export const TIMESTAMP_FORMAT = [
  'Disable',
  'h:mm',
  'hh:mm',
  'H:mm',
  'HH:mm',
  'h:mm a',
  'hh:mm a',
] as const;

export const MESSAGES_LIMIT = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
] as const;

export interface Options {
  ui: {
    timestampFormat: (typeof TIMESTAMP_FORMAT)[number];
    splitChat: boolean;
    messagesLimit: number;
  };
  notifications: {
    mentions: boolean;
    highlightKeywords: string;
  };
  recentMessages: {
    load: boolean;
  };
  twitch: {
    cards: boolean;
    animatedEmotes: boolean;
  };
  bttv: {
    emotes: boolean;
    badges: boolean;
  };
  ffz: {
    emotes: boolean;
    badges: boolean;
    emoji: boolean;
  };
  stv: {
    emotes: boolean;
    badges: boolean;
    // paints: boolean;
  };
  chatterino: {
    badges: boolean;
  };
  youtube: {
    cards: boolean;
  };
}

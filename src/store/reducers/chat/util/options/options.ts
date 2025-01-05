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

export const OPTIONS_INITIAL_STATE: Options = {
  ui: {
    timestampFormat: 'Disable',
    splitChat: true,
    messagesLimit: 200,
  },
  notifications: {
    mentions: false,
    highlightKeywords: '',
  },
  recentMessages: {
    load: true,
  },
  twitch: {
    cards: true,
    animatedEmotes: true,
  },
  bttv: {
    emotes: true,
    badges: true,
  },
  ffz: {
    emotes: true,
    badges: true,
    emoji: true,
    // emojiSkinTone: null,
  },
  stv: {
    emotes: true,
    badges: true,
    // paints: true,
  },
  chatterino: {
    badges: true,
  },
  youtube: {
    cards: true,
  },
};

export const ENTER_HIGHLIGHT_KEYWORDS_TEXT =
  'Enter Highlight Keywords\n\nHighlight certain words or phrases in your chat.\nCan be separated by a comma ","';

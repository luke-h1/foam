type ChatVariant = 'twitch' | '7tv' | 'bttv' | 'ffz';

export type ChatWebsocket<TVariant extends ChatVariant> =
  TVariant extends 'twitch'
    ? {
        variant: 'twitch';
        connect: () => void;
      }
    : object;

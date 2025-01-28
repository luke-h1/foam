import { ParserOptions } from '../types';

export const loadOptions = (
  options: Partial<ParserOptions> | null,
): ParserOptions => ({
  channelId: null,
  ...options,
  providers: {
    twitch: true,
    bttv: true,
    seventv: true,
    ffz: true,
  },
});

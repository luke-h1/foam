import { ParserOptions } from '../types';

export const loadOptions = (
  options: Partial<ParserOptions> | null,
): ParserOptions => ({
  channelId: options?.channelId ?? null,
});

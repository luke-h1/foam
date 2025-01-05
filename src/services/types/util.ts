/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Emote<TValue> {
  entries: Record<string, TValue>;
  names: Record<string, string>;
}

export interface Badge<TValue> {
  entries: Record<string, TValue>;
  users: Record<string, string[]>;
}

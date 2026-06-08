import { fetch as platformFetch, type FetchRequestInit } from 'expo/fetch';

export type AppFetchFn = (
  input: RequestInfo | URL,
  init?: FetchRequestInit,
) => Promise<Response>;

export { platformFetch };

export const chatFetch: AppFetchFn = (input, init) =>
  globalThis.fetch(input, init);

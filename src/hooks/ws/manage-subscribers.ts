import type { Subscriber } from './types';

export type Subscribers = {
  [url: string]: Set<Subscriber>;
};

const subscribers: Subscribers = {};

export const getSubscribers = (url: string): Subscriber[] => {
  // SAFETY: addSubscriber creates the set before any socket is opened for the url, and the key is never removed.
  return Array.from(subscribers[url] as Set<Subscriber>);
};

export const hasSubscribers = (url: string): boolean => {
  return !!subscribers[url] && subscribers[url].size > 0;
};

export const hasSubscriber = (url: string, subscriber: Subscriber): boolean => {
  return subscribers[url]?.has(subscriber) ?? false;
};

export const addSubscriber = (url: string, subscriber: Subscriber): void => {
  if (!subscribers[url]) {
    subscribers[url] = new Set<Subscriber>();
  }
  subscribers[url].add(subscriber);
};

export const removeSubscriber = (url: string, subscriber: Subscriber): void => {
  subscribers[url]?.delete(subscriber);
};

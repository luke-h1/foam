import { observable } from '@legendapp/state';
import { useSelector } from '@legendapp/state/react';

import {
  type ChannelPointsRewardTags,
  type ChannelPointsRewardTagSource,
  channelPointsRewardTitleFromTags,
} from './channelPointsRewardTitle';

const channelPointRewardTitleCache = new Map<string, string>();
const rewardIdOnlyCache = new Map<string, string>();
const rewardTitleRevision$ = observable(0);

function channelPointRewardCacheKey(
  broadcasterId: string,
  rewardId: string,
): string {
  return `${broadcasterId}:${rewardId}`;
}

export function getCachedChannelPointRewardTitle(
  broadcasterId: string,
  rewardId: string,
): string | undefined {
  return channelPointRewardTitleCache.get(
    channelPointRewardCacheKey(broadcasterId, rewardId),
  );
}
const pendingStandaloneByKey = new Map<
  string,
  { timeout: ReturnType<typeof setTimeout> }
>();

const STANDALONE_REDEMPTION_DELAY_MS = 500;

function pendingKey(login: string, rewardId: string): string {
  return `${login.toLowerCase()}:${rewardId}`;
}

/**
 * Subscribe a component to reward-title resolutions. Returns the current
 * revision; the value itself is meaningless — it only forces a re-render when a
 * newly resolved title may change what a row should display.
 */
export function useChannelPointRewardTitleRevision(): number {
  return useSelector(rewardTitleRevision$);
}

function notifyChannelPointRewardTitleListeners(): void {
  rewardTitleRevision$.set(revision => revision + 1);
}

export function cacheChannelPointRewardTitle(
  broadcasterId: string,
  rewardId: string,
  title: string,
): void {
  const trimmed = title.trim();
  if (!trimmed) {
    return;
  }

  channelPointRewardTitleCache.set(
    channelPointRewardCacheKey(broadcasterId, rewardId),
    trimmed,
  );
  rewardIdOnlyCache.set(rewardId, trimmed);
  notifyChannelPointRewardTitleListeners();
}

export function resolveChannelPointRewardTitle(options: {
  tags: ChannelPointsRewardTags | ChannelPointsRewardTagSource;
  broadcasterId?: string;
}): string | undefined {
  const fromTags = channelPointsRewardTitleFromTags(options.tags);
  if (fromTags) {
    return fromTags;
  }

  const rewardId = options.tags['custom-reward-id'];
  if (typeof rewardId !== 'string') {
    return undefined;
  }

  const broadcasterId = options.tags['room-id'] ?? options.broadcasterId;
  if (typeof broadcasterId === 'string') {
    const cached = getCachedChannelPointRewardTitle(broadcasterId, rewardId);
    if (cached) {
      return cached;
    }
  }

  return rewardIdOnlyCache.get(rewardId);
}

export function ingestChannelPointRewardTags(
  tags: ChannelPointsRewardTags,
  broadcasterId?: string,
): void {
  const rewardId = tags['custom-reward-id'];
  const roomId = tags['room-id'] ?? broadcasterId;
  const title = channelPointsRewardTitleFromTags(tags);

  if (typeof rewardId === 'string' && typeof roomId === 'string' && title) {
    cacheChannelPointRewardTitle(roomId, rewardId, title);
  }
}

export function registerDeferredRewardgiftStandalone(options: {
  login: string;
  rewardId: string;
  publish: () => void;
}): void {
  const key = pendingKey(options.login, options.rewardId);
  const existing = pendingStandaloneByKey.get(key);
  if (existing) {
    clearTimeout(existing.timeout);
  }

  const timeout = setTimeout(() => {
    pendingStandaloneByKey.delete(key);
    options.publish();
  }, STANDALONE_REDEMPTION_DELAY_MS);

  pendingStandaloneByKey.set(key, { timeout });
}

function cancelDeferredRewardgiftStandalone(
  login: string,
  rewardId: string,
): void {
  const key = pendingKey(login, rewardId);
  const pending = pendingStandaloneByKey.get(key);
  if (!pending) {
    return;
  }

  clearTimeout(pending.timeout);
  pendingStandaloneByKey.delete(key);
}

export function enrichChannelPointPrivmsgTags(
  tags: Record<string, string>,
  broadcasterId?: string,
): Record<string, string> {
  if (!tags['custom-reward-id']) {
    return tags;
  }

  ingestChannelPointRewardTags(tags, broadcasterId);

  const login = tags.login ?? tags['display-name'];
  const rewardId = tags['custom-reward-id'];
  if (login) {
    cancelDeferredRewardgiftStandalone(login, rewardId);
  }

  if (channelPointsRewardTitleFromTags(tags)) {
    return tags;
  }

  const resolved = resolveChannelPointRewardTitle({ tags, broadcasterId });
  if (!resolved) {
    return tags;
  }

  return { ...tags, 'msg-param-custom-reward-title': resolved };
}

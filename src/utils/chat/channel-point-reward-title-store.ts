import { bumpRewardTitleRevision } from '@app/store/chat/actions/reward-title-revision';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-from-tags';
import {
  type ChannelPointsRewardTags,
  type ChannelPointsRewardTagSource,
} from '@app/utils/chat/channel-points-reward-title/types';
import { evictOldestWhenFull } from '@app/utils/collection/evict-oldest-when-full';

const MAX_REWARD_TITLE_ENTRIES = 100;

const channelPointRewardTitleCache = new Map<string, string>();
const rewardIdOnlyCache = new Map<string, string>();

function boundedMapSet(
  map: Map<string, string>,
  key: string,
  value: string,
): void {
  if (!map.has(key)) {
    evictOldestWhenFull(map, MAX_REWARD_TITLE_ENTRIES);
  }

  map.set(key, value);
}

function tagText(value: string | boolean | undefined): string | undefined {
  return value === true || value === false ? undefined : value;
}

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

export function cacheChannelPointRewardTitle(
  broadcasterId: string,
  rewardId: string,
  title: string,
): void {
  const trimmed = title.trim();

  if (!trimmed) {
    return;
  }

  boundedMapSet(
    channelPointRewardTitleCache,
    channelPointRewardCacheKey(broadcasterId, rewardId),
    trimmed,
  );

  boundedMapSet(rewardIdOnlyCache, rewardId, trimmed);
  bumpRewardTitleRevision();
}

export function resolveChannelPointRewardTitle(options: {
  tags: ChannelPointsRewardTags | ChannelPointsRewardTagSource;
  broadcasterId?: string;
}): string | undefined {
  const fromTags = channelPointsRewardTitleFromTags(options.tags);

  if (fromTags) {
    return fromTags;
  }

  const rewardId = tagText(options.tags['custom-reward-id']);

  if (rewardId === undefined) {
    return undefined;
  }

  const broadcasterId = tagText(
    options.tags['room-id'] ?? options.broadcasterId,
  );

  const cached =
    broadcasterId === undefined
      ? undefined
      : getCachedChannelPointRewardTitle(broadcasterId, rewardId);

  return cached ?? rewardIdOnlyCache.get(rewardId);
}

export function ingestChannelPointRewardTags(
  tags: ChannelPointsRewardTags,
  broadcasterId?: string,
): void {
  const rewardId = tagText(tags['custom-reward-id']);
  const roomId = tagText(tags['room-id'] ?? broadcasterId);
  const title = channelPointsRewardTitleFromTags(tags);

  if (rewardId !== undefined && roomId !== undefined && title) {
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
) {
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

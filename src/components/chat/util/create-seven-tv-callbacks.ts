import type {
  CosmeticCreateCallbackData,
  CosmeticDeleteCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementCreateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementResetCallbackData,
  EntitlementUpdateCallbackData,
} from '@app/components/chat/hooks/use-seven-tv-ws';
import { countMetric } from '@app/lib/sentry';
import {
  addBadge,
  addPaint,
  removeBadge,
  removePaint,
} from '@app/store/chat/actions/cosmetics';
import {
  applyCosmeticCreateEvent,
  applyEntitlementCreateEvent,
  applyEntitlementDeleteEvent,
  applyEntitlementResetEvent,
  applyEntitlementUpdateEvent,
} from '@app/store/chat/actions/cosmetics-bridge';
import {
  findPersonalEmoteSetOwner,
  refreshUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import type { SanitisedEmote } from '@app/types/emote';
import type {
  BadgeData,
  ChangeMap,
  CosmeticCreate,
  PaintData,
} from '@app/types/seven-tv/cosmetics';
import { generateStvEmoteNotice } from '@app/utils/emote/stv/generate-seven-tv-emote-notice';
import { logger } from '@app/utils/logger';
import { normalizeSevenTvPaint } from '@app/utils/seven-tv/cosmetics/normalize-seven-tv-paint';
import { sanitise7TvBadge } from '@app/utils/seven-tv/cosmetics/sanitise7-tv-badge';

type CosmeticChangeValue = NonNullable<
  ChangeMap<CosmeticCreate>['updated' | 'pushed']
>[number];

function getDataFromChangeValue(
  entry: CosmeticChangeValue,
): PaintData | BadgeData | undefined {
  return entry.value?.object?.data;
}

function shouldSuppressEmoteNotice(emote: SanitisedEmote): boolean {
  return emote.name?.toLowerCase().includes('nnys') ?? false;
}

function isBadgeData(
  data: PaintData | BadgeData | undefined,
): data is BadgeData & { ref_id?: string } {
  return data !== undefined && 'id' in data && 'name' in data && 'host' in data;
}

function isPaintData(
  data: PaintData | BadgeData | undefined,
): data is PaintData & { ref_id?: string } {
  return (
    data !== undefined && 'id' in data && 'name' in data && 'function' in data
  );
}

function onCosmeticCreate(data: CosmeticCreateCallbackData) {
  if (!data.cosmetic?.object) {
    return;
  }
  applyCosmeticCreateEvent(data.cosmetic, data.kind);
}

function onEntitlementCreate(data: EntitlementCreateCallbackData) {
  applyEntitlementCreateEvent(data);
}

function onEntitlementReset(data: EntitlementResetCallbackData) {
  applyEntitlementResetEvent(data.sevenTvUserId);
}

function onCosmeticDelete(data: CosmeticDeleteCallbackData) {
  removeBadge(data.cosmeticId);
  removePaint(data.cosmeticId);
  logger.stvWs.info(`Removed cosmetic from cache: ${data.cosmeticId}`);
}

function onEntitlementUpdate(data: EntitlementUpdateCallbackData) {
  applyEntitlementUpdateEvent(data);
}

function onEntitlementDelete(data: EntitlementDeleteCallbackData) {
  applyEntitlementDeleteEvent(data);
}

type AppliedCosmeticCounts = { added: number; updated: number };

/**
 * Writes every paint the update carries into the cache and reports how many
 * were new against how many replaced an existing entry.
 */
function applyPaintCosmeticUpdate(
  changes: CosmeticUpdateCallbackData['changes'],
): AppliedCosmeticCounts {
  const cachePaint = (entry: CosmeticChangeValue, label: string) => {
    const paintData = getDataFromChangeValue(entry);

    if (!isPaintData(paintData)) {
      return false;
    }

    addPaint(normalizeSevenTvPaint(paintData));
    logger.stvWs.info(`${label}: ${paintData.name}`);
    return true;
  };

  const updated = (changes.updated ?? []).filter(entry =>
    cachePaint(entry, 'Updated paint in cache'),
  ).length;

  const added = (changes.pushed ?? []).filter(entry =>
    cachePaint(entry, 'Added paint from update'),
  ).length;

  return { added, updated };
}

/**
 * The badge counterpart of `applyPaintCosmeticUpdate`.
 */
function applyBadgeCosmeticUpdate(
  changes: CosmeticUpdateCallbackData['changes'],
): AppliedCosmeticCounts {
  const cacheBadge = (entry: CosmeticChangeValue, label: string) => {
    const badgeData = getDataFromChangeValue(entry);

    if (!isBadgeData(badgeData)) {
      return false;
    }

    const sanitised = sanitise7TvBadge(badgeData);
    addBadge(sanitised);
    logger.stvWs.info(`${label}: ${sanitised.title}`);
    return true;
  };

  const updated = (changes.updated ?? []).filter(entry =>
    cacheBadge(entry, 'Updated badge in cache'),
  ).length;

  const added = (changes.pushed ?? []).filter(entry =>
    cacheBadge(entry, 'Added badge from update'),
  ).length;

  return { added, updated };
}

interface CreateSevenTvCallbacksOptions {
  channelId: string;
  sevenTvEmoteSetId: string | undefined;
  updateSevenTvEmotes: (
    cId: string,
    added: SanitisedEmote[],
    removed: SanitisedEmote[],
  ) => void;
  onEmoteNotice?: (message: ReturnType<typeof generateStvEmoteNotice>) => void;
  channelName: string;
}

export function createSevenTvCallbacks({
  channelId,
  channelName,
  sevenTvEmoteSetId,
  updateSevenTvEmotes,
  onEmoteNotice,
}: CreateSevenTvCallbacksOptions) {
  const onEmoteUpdate = ({
    added,
    removed,
    channelId: cId,
  }: {
    added: SanitisedEmote[];
    removed: SanitisedEmote[];
    channelId: string;
  }) => {
    logger.stvWs.info(
      `Channel ${cId}: +${added.length} -${removed.length} emotes`,
    );

    updateSevenTvEmotes(cId, added, removed);

    added.forEach(emote => {
      if (shouldSuppressEmoteNotice(emote)) {
        return;
      }

      onEmoteNotice?.(
        generateStvEmoteNotice({
          channelName,
          emote,
          type: 'added',
        }),
      );
    });

    removed.forEach(emote => {
      if (shouldSuppressEmoteNotice(emote)) {
        return;
      }

      onEmoteNotice?.(
        generateStvEmoteNotice({
          channelName,
          emote,
          type: 'removed',
        }),
      );
    });
  };

  // An emote_set.update for a set that is not the channel's active one is a
  // chatter's personal set; refresh the owner's cached personal emotes.
  const onEmoteSetUpdateForOtherSet = (emoteSetId: string) => {
    const ownerTtvUserId = findPersonalEmoteSetOwner(channelId, emoteSetId);
    if (ownerTtvUserId) {
      void refreshUserPersonalEmotes(ownerTtvUserId, channelId);
    }
  };

  const onCosmeticUpdate = (data: CosmeticUpdateCallbackData) => {
    const applied =
      data.kind === 'PAINT'
        ? applyPaintCosmeticUpdate(data.changes)
        : applyBadgeCosmeticUpdate(data.changes);

    if (applied.added + applied.updated === 0) {
      return;
    }

    const isPaint = data.kind === 'PAINT';
    const action = isPaint ? 'paint_update_applied' : 'badge_update_applied';
    const resourceType = isPaint ? 'paints' : 'badges';

    countMetric(
      'seven_tv.cosmetic_update.applied',
      {
        action,
        channel_id: channelId,
        channel_name: channelName,
        provider: 'seven_tv',
        resource_type: resourceType,
        screen: 'chat',
        seven_tv_emote_set_id: sevenTvEmoteSetId ?? 'unknown',
      },
      applied.added + applied.updated,
    );

    logger.stvWs.info(
      isPaint ? 'Applied 7TV paint update' : 'Applied 7TV badge update',
      {
        name: isPaint ? 'seven_tv_cosmetics_info' : 'seven_tv_badges_info',
        action,
        ...(isPaint
          ? { added_paints: applied.added, updated_paints: applied.updated }
          : { added_badges: applied.added, updated_badges: applied.updated }),
        channel_id: channelId,
        channel_name: channelName,
        provider: 'seven_tv',
        resource_type: resourceType,
        screen: 'chat',
        seven_tv_emote_set_id: sevenTvEmoteSetId,
      },
    );
  };

  return {
    onEmoteUpdate,
    onEmoteSetUpdateForOtherSet,
    onCosmeticCreate,
    onEntitlementCreate,
    onEntitlementReset,
    onCosmeticUpdate,
    onCosmeticDelete,
    onEntitlementUpdate,
    onEntitlementDelete,
    twitchChannelId: channelId,
    sevenTvEmoteSetId,
  };
}

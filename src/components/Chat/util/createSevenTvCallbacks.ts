import type {
  CosmeticCreateCallbackData,
  CosmeticDeleteCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementCreateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementResetCallbackData,
  EntitlementUpdateCallbackData,
} from '@app/components/Chat/hooks/useSeventvWs';
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
} from '@app/store/chat/actions/cosmeticsBridge';
import {
  findPersonalEmoteSetOwner,
  refreshUserPersonalEmotes,
} from '@app/store/chat/actions/personalEmotes';
import type { SanitisedEmote } from '@app/types/emote';
import type {
  BadgeData,
  ChangeMap,
  CosmeticCreate,
  PaintData,
} from '@app/types/seventv/cosmetics';
import { generateStvEmoteNotice } from '@app/utils/emote/stv/generateSevenTvEmoteNotice';
import { logger } from '@app/utils/logger';
import { normalizeSevenTvPaint } from '@app/utils/seventv/cosmetics/normalizeSevenTvPaint';
import { sanitise7TvBadge } from '@app/utils/seventv/cosmetics/sanitise7TvBadge';

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

export function createSevenTvCallbacks({
  channelId,
  channelName,
  sevenTvEmoteSetId,
  updateSevenTvEmotes,
  onEmoteNotice,
}: {
  channelId: string;
  sevenTvEmoteSetId: string | undefined;
  updateSevenTvEmotes: (
    cId: string,
    added: SanitisedEmote[],
    removed: SanitisedEmote[],
  ) => void;
  onEmoteNotice?: (message: ReturnType<typeof generateStvEmoteNotice>) => void;
  channelName: string;
}) {
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
    if (data.kind === 'PAINT') {
      const { changes } = data;
      let added_paints = 0;
      let updated_paints = 0;
      changes.updated?.forEach(update => {
        const paintData = getDataFromChangeValue(update);
        if (isPaintData(paintData)) {
          addPaint(normalizeSevenTvPaint(paintData));
          updated_paints += 1;
          logger.stvWs.info(`Updated paint in cache: ${paintData.name}`);
        }
      });
      changes.pushed?.forEach(push => {
        const paintData = getDataFromChangeValue(push);
        if (isPaintData(paintData)) {
          addPaint(normalizeSevenTvPaint(paintData));
          added_paints += 1;
          logger.stvWs.info(`Added paint from update: ${paintData.name}`);
        }
      });

      if (added_paints > 0 || updated_paints > 0) {
        countMetric(
          'seven_tv.cosmetic_update.applied',
          {
            action: 'paint_update_applied',
            channel_id: channelId,
            channel_name: channelName,
            provider: 'seven_tv',
            resource_type: 'paints',
            screen: 'chat',
            seven_tv_emote_set_id: sevenTvEmoteSetId ?? 'unknown',
          },
          added_paints + updated_paints,
        );
        logger.stvWs.info('Applied 7TV paint update', {
          name: 'seven_tv_cosmetics_info',
          action: 'paint_update_applied',
          added_paints,
          channel_id: channelId,
          channel_name: channelName,
          provider: 'seven_tv',
          resource_type: 'paints',
          screen: 'chat',
          seven_tv_emote_set_id: sevenTvEmoteSetId,
          updated_paints,
        });
      }
    }
    if (data.kind === 'BADGE') {
      const { changes } = data;
      let added_badges = 0;
      let updated_badges = 0;
      const toSanitised = (entry: CosmeticChangeValue) => {
        const badgeData = getDataFromChangeValue(entry);
        if (isBadgeData(badgeData)) {
          return sanitise7TvBadge(badgeData);
        }
        return null;
      };
      changes.updated?.forEach(update => {
        const sanitised = toSanitised(update);
        if (sanitised) {
          addBadge(sanitised);
          updated_badges += 1;
          logger.stvWs.info(`Updated badge in cache: ${sanitised.title}`);
        }
      });
      changes.pushed?.forEach(push => {
        const sanitised = toSanitised(push);
        if (sanitised) {
          addBadge(sanitised);
          added_badges += 1;
          logger.stvWs.info(`Added badge from update: ${sanitised.title}`);
        }
      });

      if (added_badges > 0 || updated_badges > 0) {
        countMetric(
          'seven_tv.cosmetic_update.applied',
          {
            action: 'badge_update_applied',
            channel_id: channelId,
            channel_name: channelName,
            provider: 'seven_tv',
            resource_type: 'badges',
            screen: 'chat',
            seven_tv_emote_set_id: sevenTvEmoteSetId ?? 'unknown',
          },
          added_badges + updated_badges,
        );
        logger.stvWs.info('Applied 7TV badge update', {
          name: 'seven_tv_badges_info',
          action: 'badge_update_applied',
          added_badges,
          channel_id: channelId,
          channel_name: channelName,
          provider: 'seven_tv',
          resource_type: 'badges',
          screen: 'chat',
          seven_tv_emote_set_id: sevenTvEmoteSetId,
          updated_badges,
        });
      }
    }
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

import { PaintRadialGradientShape } from '@app/graphql/generated/gql';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import {
  V4Badge,
  V4Paint,
  sevenTvService,
} from '@app/services/seventv-service';
import {
  SanitisedBadgeSet,
  twitchBadgeService,
} from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import { ClearChatTags } from '@app/types/chat/irc-tags/clearchat';
import { ClearMsgTags } from '@app/types/chat/irc-tags/clearmsg';
import { GlobalUserStateTags } from '@app/types/chat/irc-tags/globaluserstate';
import { NoticeTags } from '@app/types/chat/irc-tags/notice';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { RoomStateTags } from '@app/types/chat/irc-tags/roomstate';
import {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  UserNoticeVariantMap,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  PaintData,
  PaintFunction,
  PaintShape,
  PaintShadow,
} from '@app/utils/color/seventv-ws-service';
import {
  cacheImageFromUrl,
  clearSessionCache,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';
import { batch, observable } from '@legendapp/state';
import {
  configureObservablePersistence,
  persistObservable,
} from '@legendapp/state/persist';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { useSelector } from '@legendapp/state/react';
import { ViewStyle } from 'react-native';
import { usePreferences } from './preferenceStore';

configureObservablePersistence({
  pluginLocal: ObservablePersistMMKV,
});

/**
 * User cosmetic data from 7TV WebSocket
 * Stores paints, badges, and personal emotes for a user
 */
export interface UserCosmetics {
  /**
   * Active paint ID
   */
  paint_id: string | null;
  /**
   * Active Badge ID
   */
  badge_id: string | null;

  /**
   * 7TV cosmetics
   */
  paints: PaintData[];

  /**
   * 7TV badges
   */
  badges: SanitisedBadgeSet[];
  /**
   * 7TV personal emotes
   */
  personal_emotes?: SanitisedBadgeSet[];
  user_info: {
    lastUpdate: number;
    user_id: string;
    ttv_user_id: string | null;
    avatar_url: string | null;
    personal_set_id: string[];
    color?: string;
  };
}

/**
 * Paint data associated with a specific user (for userPaints store)
 */
export interface UserPaint extends PaintData {
  ttv_user_id: string;
}

export interface ChatUser {
  name: string;
  color: string;
  cosmetics?: UserCosmetics;
  avatar: string | null;
  userId: string;
}

export interface Bit {
  name: string;
  tiers: {
    min_bits: string;
  }[];
}

export interface ChatMessageType<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
> {
  id: string;
  userstate: UserStateTags;
  message: ParsedPart[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
  style?: ViewStyle;
  parentDisplayName?: string;
  replyDisplayName: string;
  replyBody: string;
  parentColor?: string;
  notice_tags?: TNoticeType extends 'userstate'
    ? UserStateTags
    : TNoticeType extends 'usernotice'
      ? TVariant extends keyof UserNoticeVariantMap
        ? UserNoticeTagsByVariant<TVariant>
        : UserNoticeTags
      : TNoticeType extends 'clearchat'
        ? ClearChatTags
        : TNoticeType extends 'clearmsg'
          ? ClearMsgTags
          : TNoticeType extends 'globalusernotice'
            ? GlobalUserStateTags
            : TNoticeType extends 'roomstate'
              ? RoomStateTags
              : TNoticeType extends 'notice'
                ? NoticeTags
                : never;
}

export type ChatLoadingState =
  | 'IDLE'
  | 'RESTORING_FROM_CACHE'
  | 'RESTORED_FROM_CACHE'
  | 'LOADING'
  | 'COMPLETED'
  | 'ERROR';

export interface ChannelCacheType {
  emotes: SanitisedEmote[];
  badges: SanitisedBadgeSet[];
  lastUpdated: number;
  twitchChannelEmotes: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];

  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];

  /**
   * Keyed by userId
   */
  sevenTvPersonalEmotes: Record<string, SanitisedEmote[]>;
  sevenTvPersonalBadges: Record<string, SanitisedBadgeSet[]>;

  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  twitchChannelBadges: SanitisedBadgeSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  chatterinoBadges: SanitisedBadgeSet[];
  sevenTvEmoteSetId?: string;
}

const MAX_MESSAGES = 500;
const MAX_CACHED_CHANNELS = 10;
const MAX_COSMETIC_ENTRIES = 500;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

const messageKeySet = new Set<string>();

const messageColorIndex = new Map<string, string>();

const getMessageKey = (messageId: string, messageNonce: string): string =>
  `${messageId}_${messageNonce}`;

const emoteImageCachePromises = new Map<string, Promise<string>>();

let activeLoadController: AbortController | null = null;

/**
 * Creates a new AbortController for loading channel resources.
 * Automatically aborts any previous in-flight request.
 */
export const createLoadController = (): AbortController => {
  if (activeLoadController) {
    activeLoadController.abort();
    logger.main.info('🚫 Aborted previous load request');
  }
  activeLoadController = new AbortController();
  return activeLoadController;
};

export const abortCurrentLoad = (): void => {
  if (activeLoadController) {
    activeLoadController.abort();
    activeLoadController = null;
    logger.main.info('🚫 Aborted current load request');
  }
};

export const isLoadAborted = (): boolean => {
  return activeLoadController?.signal.aborted ?? false;
};

const emptyEmoteData = {
  twitchChannelEmotes: [],
  twitchGlobalEmotes: [],
  sevenTvChannelEmotes: [],
  sevenTvGlobalEmotes: [],
  sevenTvPersonalBadges: {},
  sevenTvPersonalEmotes: {},
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],
  bttvGlobalEmotes: [],
  bttvChannelEmotes: [],
  twitchChannelBadges: [],
  twitchGlobalBadges: [],
  ffzChannelBadges: [],
  ffzGlobalBadges: [],
  badges: [],
  emotes: [],
  lastUpdated: 0,
  sevenTvEmoteSetId: undefined,
  chatterinoBadges: [],
} satisfies ChannelCacheType;

const limitChannelCaches = (
  channelCaches: Record<string, ChannelCacheType>,
  currentChannelId: string | null,
): Record<string, ChannelCacheType> => {
  const entries = Object.entries(channelCaches);

  if (entries.length <= MAX_CACHED_CHANNELS) {
    return channelCaches;
  }

  const sorted = entries.sort((a, b) => {
    if (a[0] === currentChannelId) return -1;
    if (b[0] === currentChannelId) return 1;
    return (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0);
  });

  const limited = sorted.slice(0, MAX_CACHED_CHANNELS);
  logger.main.info(
    `Pruned channelCaches from ${entries.length} to ${limited.length} channels`,
  );
  return Object.fromEntries(limited);
};

export const chatStore$ = observable({
  persisted: {
    channelCaches: {} as Record<string, ChannelCacheType>,
    lastGlobalUpdate: 0,
  },

  // Transient state not persisted between channel swaps
  loadingState: 'IDLE' as ChatLoadingState,
  currentChannelId: null as string | null,
  emojis: [] as SanitisedEmote[],
  bits: [] as Bit[],
  ttvUsers: [] as ChatUser[],
  messages: [] as ChatMessageType<never>[],

  /**
   * 7TV paints cache keyed by paint ID
   */
  paints: {} as Record<string, PaintData>,

  /**
   * Mapping of Twitch user ID to paint ID
   * Stored separately so we can link users to paints before paint data arrives
   */
  userPaintIds: {} as Record<string, string>,

  /**
   * 7TV badges cache keyed by badge ID
   */
  badges: {} as Record<string, SanitisedBadgeSet>,

  /**
   * Mapping of Twitch user ID to badge ID
   * Stored separately so we can link users to their badges
   */
  userBadgeIds: {} as Record<string, string>,
});

persistObservable(chatStore$.persisted, {
  local: 'chat-store-v2',
});

export const addMessage = <TNoticeType extends NoticeVariants>(
  message: ChatMessageType<TNoticeType>,
) => {
  const key = getMessageKey(message.message_id, message.message_nonce);
  if (messageKeySet.has(key)) {
    return;
  }
  messageKeySet.add(key);

  if (message.userstate?.color && message.message_id) {
    messageColorIndex.set(message.message_id, message.userstate.color);
  }

  const currentLength = chatStore$.messages.peek().length;
  chatStore$.messages.push(message as ChatMessageType<never>);

  if (currentLength >= MAX_MESSAGES) {
    const removeCount = Math.floor(MAX_MESSAGES * 0.2);
    const removed = chatStore$.messages.peek().slice(0, removeCount);
    removed.forEach(msg => {
      messageKeySet.delete(getMessageKey(msg.message_id, msg.message_nonce));
      messageColorIndex.delete(msg.message_id);
    });
    chatStore$.messages.set(msgs => msgs.slice(removeCount));
  }
};

export const addMessages = (messages: ChatMessageType<never>[]) => {
  if (messages.length === 0) return;

  const newMessages = messages.filter(msg => {
    const key = getMessageKey(msg.message_id, msg.message_nonce);
    if (messageKeySet.has(key)) {
      return false;
    }
    messageKeySet.add(key);
    return true;
  });

  if (newMessages.length === 0) return;

  newMessages.forEach(msg => {
    if (msg.userstate?.color && msg.message_id) {
      messageColorIndex.set(msg.message_id, msg.userstate.color);
    }
  });

  batch(() => {
    const current = chatStore$.messages.peek();
    const updated = [...current, ...newMessages];

    if (updated.length > MAX_MESSAGES) {
      const removeCount = Math.floor(MAX_MESSAGES * 0.2);
      const removed = updated.slice(0, removeCount);
      removed.forEach(msg => {
        messageKeySet.delete(getMessageKey(msg.message_id, msg.message_nonce));
        messageColorIndex.delete(msg.message_id);
      });
      chatStore$.messages.set(updated.slice(removeCount));
    } else {
      chatStore$.messages.set(updated);
    }
  });
};

export const updateMessage = (
  messageId: string,
  messageNonce: string,
  updates: Partial<Pick<ChatMessageType<never>, 'message' | 'badges'>>,
) => {
  const messages = chatStore$.messages.peek();
  const index = messages.findIndex(
    m => m.message_id === messageId && m.message_nonce === messageNonce,
  );
  if (index >= 0) {
    const msg$ = chatStore$.messages[index];
    if (msg$) {
      msg$.set(prev => ({ ...prev, ...updates }));
    }
  }
};

export const clearMessages = () => {
  messageKeySet.clear();
  messageColorIndex.clear();
  chatStore$.messages.set([]);
};

/**
 * Used for reply parent color without scanning the full message list
 */
export const getMessageColor = (messageId: string): string | undefined => {
  return messageColorIndex.get(messageId);
};

export const addTtvUser = (user: ChatUser) => {
  const existingUsers = chatStore$.ttvUsers.peek();
  const newUsers = [...existingUsers, user].filter(
    (existingUser, index, self) =>
      index === self.findIndex(t => t.userId === existingUser.userId),
  );
  chatStore$.ttvUsers.set(newUsers);
};

export const clearTtvUsers = () => {
  chatStore$.ttvUsers.set([]);
};

export const setBits = (bits: Bit[]) => {
  chatStore$.bits.set(bits);
};

/**
 * Add a paint to the paints cache
 */
export const addPaint = (paint: PaintData) => {
  if (paint.id) {
    const currentPaints = chatStore$.paints.peek();
    chatStore$.paints.set({ ...currentPaints, [paint.id]: paint });
  }
};

/**
 * Get a paint by its ID from the cache
 */
export const getPaint = (paintId: string): PaintData | undefined => {
  return chatStore$.paints[paintId]?.peek();
};

/**
 * Pack RGBA color components into a single 32-bit signed integer.
 * This matches the format used by 7TV v3/WebSocket paints.
 */
const packRgba = (color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): number => {
  // eslint-disable-next-line no-bitwise
  return (color.r << 24) | (color.g << 16) | (color.b << 8) | color.a | 0;
};

/**
 * Convert v4 GQL paint response to internal PaintData format.
 * v4 uses a layers-based model; we extract the first layer to determine
 * the paint function, stops, angle, shape, etc.
 */
const convertV4PaintToPaintData = (paint: V4Paint): PaintData => {
  const firstLayer = paint.data.layers[0];
  const ty = firstLayer?.ty;

  let paintFunction: PaintFunction = 'LINEAR_GRADIENT';
  let angle = 0;
  let shape: PaintShape = 'circle';
  let repeat = false;
  let color: number | null = null;
  let imageUrl = '';

  const stopsIndexed: IndexedCollection<{ at: number; color: number }> = {
    length: 0,
  };

  // eslint-disable-next-line no-underscore-dangle
  switch (ty?.__typename) {
    case 'PaintLayerTypeLinearGradient':
      paintFunction = 'LINEAR_GRADIENT';
      angle = ty.angle;
      repeat = ty.repeating;
      ty.stops.forEach((stop, index) => {
        stopsIndexed[index] = { at: stop.at, color: packRgba(stop.color) };
      });
      stopsIndexed.length = ty.stops.length;
      break;
    case 'PaintLayerTypeRadialGradient':
      paintFunction = 'RADIAL_GRADIENT';
      repeat = ty.repeating;
      shape =
        ty.shape === PaintRadialGradientShape.Ellipse ? 'ellipse' : 'circle';
      ty.stops.forEach((stop, index) => {
        stopsIndexed[index] = { at: stop.at, color: packRgba(stop.color) };
      });
      stopsIndexed.length = ty.stops.length;
      break;
    case 'PaintLayerTypeSingleColor':
      color = packRgba(ty.color);
      break;
    case 'PaintLayerTypeImage':
      paintFunction = 'URL';
      imageUrl = ty.images[0]?.url ?? '';
      break;
    default:
      break;
  }

  const shadowsIndexed: IndexedCollection<PaintShadow> = {
    length: paint.data.shadows.length,
  };
  paint.data.shadows.forEach((shadow, index) => {
    shadowsIndexed[index] = {
      color: packRgba(shadow.color),
      radius: shadow.blur,
      x_offset: shadow.offsetX,
      y_offset: shadow.offsetY,
    };
  });

  return {
    id: paint.id,
    name: paint.name,
    color,
    function: paintFunction,
    repeat,
    angle,
    shape,
    image_url: imageUrl,
    stops: stopsIndexed,
    shadows: shadowsIndexed,
    gradients: { length: 0 },
    text: null,
  };
};

const convertV4BadgeToSanitised = (badge: V4Badge): SanitisedBadgeSet => {
  const bestImage =
    badge.images.find(img => img.scale === 4) ??
    badge.images.find(img => img.scale === 3) ??
    badge.images[0];

  return {
    id: badge.id,
    url: bestImage?.url ?? `https://cdn.7tv.app/badge/${badge.id}/4x.webp`,
    type: '7TV Badge',
    title: badge.description || badge.name,
    set: badge.id,
    provider: '7tv',
  };
};

/**
 * Fetch user cosmetics via GQL and cache them
 * @param sevenTvUserId - The 7TV user ID
 * @returns The Twitch user ID if found, null otherwise
 */
export const fetchAndCacheUserCosmetics = async (
  sevenTvUserId: string,
): Promise<string | null> => {
  try {
    logger.stvWs.info(`Fetching GQL cosmetics for 7TV user: ${sevenTvUserId}`);
    const cosmetics = await sevenTvService.getUserCosmeticsGql(sevenTvUserId);

    if (!cosmetics) {
      logger.stvWs.warn(`No cosmetics found for 7TV user: ${sevenTvUserId}`);
      return null;
    }

    logger.stvWs.info(
      `GQL response for ${sevenTvUserId}: ttvUserId=${cosmetics.ttvUserId}, paintId=${cosmetics.paintId}, badgeId=${cosmetics.badgeId}, hasPaint=${!!cosmetics.paint}, hasBadge=${!!cosmetics.badge}`,
    );

    if (cosmetics.paint) {
      const paintData = convertV4PaintToPaintData(cosmetics.paint);
      logger.stvWs.info(
        `Caching paint: id=${paintData.id}, name=${cosmetics.paint.name}, function=${paintData.function}`,
      );
      addPaint(paintData);
    } else {
      logger.stvWs.debug(`No paint data in GQL response for ${sevenTvUserId}`);
    }

    if (cosmetics.badge) {
      const badgeData = convertV4BadgeToSanitised(cosmetics.badge);
      addBadge(badgeData);
      logger.stvWs.info(`Cached badge: ${cosmetics.badge.name}`);
    }

    // Link user to their cosmetics
    if (cosmetics.ttvUserId) {
      if (cosmetics.paintId) {
        const currentUserPaintIds = chatStore$.userPaintIds.peek();
        chatStore$.userPaintIds.set({
          ...currentUserPaintIds,
          [cosmetics.ttvUserId]: cosmetics.paintId,
        });
        logger.stvWs.info(
          `Linked paint ${cosmetics.paintId} to Twitch user ${cosmetics.ttvUserId}`,
        );

        // Verify the link was set
        const verifyPaintId =
          chatStore$.userPaintIds[cosmetics.ttvUserId]?.peek();
        const verifyPaint = chatStore$.paints[cosmetics.paintId]?.peek();
        logger.stvWs.info(
          `Verification: userPaintIds[${cosmetics.ttvUserId}]=${verifyPaintId}, paints[${cosmetics.paintId}]=${verifyPaint ? verifyPaint.name : 'NOT FOUND'}`,
        );
      } else {
        logger.stvWs.debug(
          `No paintId in cosmetics response for ${cosmetics.ttvUserId}`,
        );
      }

      if (cosmetics.badgeId) {
        const currentUserBadgeIds = chatStore$.userBadgeIds.peek();
        chatStore$.userBadgeIds.set({
          ...currentUserBadgeIds,
          [cosmetics.ttvUserId]: cosmetics.badgeId,
        });
        logger.stvWs.info(
          `Linked badge ${cosmetics.badgeId} to user ${cosmetics.ttvUserId}`,
        );
      }
    } else {
      logger.stvWs.warn(
        `No ttvUserId in cosmetics response for 7TV user ${sevenTvUserId}`,
      );
    }

    return cosmetics.ttvUserId;
  } catch (error) {
    logger.stvWs.error(
      `Error fetching cosmetics for user ${sevenTvUserId}:`,
      error,
    );
    return null;
  }
};

/**
 * Associate a Twitch user with a paint ID
 * The actual paint data should already be in the cache from cosmetic.create or GQL fetch
 * @param ttvUserId - The Twitch user ID
 * @param paintId - The paint ID to associate
 */
export const setUserPaint = (ttvUserId: string, paintId: string): void => {
  const currentUserPaintIds = chatStore$.userPaintIds.peek();
  const entries = Object.keys(currentUserPaintIds);
  if (entries.length >= MAX_COSMETIC_ENTRIES) {
    const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
    const trimmed = Object.fromEntries(
      Object.entries(currentUserPaintIds).slice(trimCount),
    );
    chatStore$.userPaintIds.set({ ...trimmed, [ttvUserId]: paintId });
  } else {
    chatStore$.userPaintIds.set({
      ...currentUserPaintIds,
      [ttvUserId]: paintId,
    });
  }
  logger.chat.info(`Linked paint ${paintId} to user ${ttvUserId}`);
};

/**
 * Get a user's paint by their Twitch user ID
 * Looks up the paint ID mapping, then retrieves the paint data
 */
export const getUserPaint = (ttvUserId: string): UserPaint | undefined => {
  const paintId = chatStore$.userPaintIds[ttvUserId]?.peek();
  if (!paintId) return undefined;
  const paint = chatStore$.paints[paintId]?.peek();
  if (!paint) return undefined;
  return { ...paint, ttv_user_id: ttvUserId };
};

/**
 * Add a badge to the badges cache
 */
export const addBadge = (badge: SanitisedBadgeSet) => {
  if (badge.id) {
    const currentBadges = chatStore$.badges.peek();
    chatStore$.badges.set({ ...currentBadges, [badge.id]: badge });
  }
};

/**
 * Get a badge by its ID from the cache
 */
export const getBadge = (badgeId: string): SanitisedBadgeSet | undefined => {
  return chatStore$.badges[badgeId]?.peek();
};

/**
 * Associate a Twitch user with a badge ID
 * The actual badge data should already be in the cache from cosmetic.create or GQL fetch
 * @param ttvUserId - The Twitch user ID
 * @param badgeId - The badge ID to associate
 */
export const setUserBadge = (ttvUserId: string, badgeId: string): void => {
  const currentUserBadgeIds = chatStore$.userBadgeIds.peek();
  const entries = Object.keys(currentUserBadgeIds);
  if (entries.length >= MAX_COSMETIC_ENTRIES) {
    const trimCount = Math.floor(MAX_COSMETIC_ENTRIES * 0.2);
    const trimmed = Object.fromEntries(
      Object.entries(currentUserBadgeIds).slice(trimCount),
    );
    chatStore$.userBadgeIds.set({ ...trimmed, [ttvUserId]: badgeId });
  } else {
    chatStore$.userBadgeIds.set({
      ...currentUserBadgeIds,
      [ttvUserId]: badgeId,
    });
  }
  logger.chat.info(`Linked badge ${badgeId} to user ${ttvUserId}`);
};

/**
 * Get a user's badge by their Twitch user ID
 * Looks up the badge ID mapping, then retrieves the badge data
 */
export const getUserBadge = (
  ttvUserId: string,
): SanitisedBadgeSet | undefined => {
  const badgeId = chatStore$.userBadgeIds[ttvUserId]?.peek();
  if (!badgeId) return undefined;
  return chatStore$.badges[badgeId]?.peek();
};

/**
 * Update a badge in the cache
 * Used when cosmetic.update event is received
 */
export const updateBadge = (badge: SanitisedBadgeSet) => {
  if (badge.id) {
    const currentBadges = chatStore$.badges.peek();
    chatStore$.badges.set({ ...currentBadges, [badge.id]: badge });
    logger.chat.info(`Updated badge in cache: ${badge.id}`);
  }
};

/**
 * Remove a badge from the cache
 * Used when cosmetic.delete event is received
 */
export const removeBadge = (badgeId: string) => {
  const currentBadges = chatStore$.badges.peek();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [badgeId]: _removed, ...remainingBadges } = currentBadges;
  chatStore$.badges.set(remainingBadges);
  logger.chat.info(`Removed badge from cache: ${badgeId}`);

  // Also remove any user associations with this badge
  const currentUserBadgeIds = chatStore$.userBadgeIds.peek();
  const updatedUserBadgeIds = Object.fromEntries(
    Object.entries(currentUserBadgeIds).filter(
      ([, userBadgeId]) => userBadgeId !== badgeId,
    ),
  );
  chatStore$.userBadgeIds.set(updatedUserBadgeIds);
};

/**
 * Remove a user's badge association
 * Used when entitlement.delete event is received
 */
export const removeUserBadge = (ttvUserId: string) => {
  const currentUserBadgeIds = chatStore$.userBadgeIds.peek();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [ttvUserId]: _removed, ...remainingUserBadgeIds } =
    currentUserBadgeIds;
  chatStore$.userBadgeIds.set(remainingUserBadgeIds);
  logger.chat.info(`Removed badge association for user: ${ttvUserId}`);
};

/**
 * Update a paint in the cache
 * Used when cosmetic.update event is received
 */
export const updatePaint = (paint: PaintData) => {
  if (paint.id) {
    const currentPaints = chatStore$.paints.peek();
    chatStore$.paints.set({ ...currentPaints, [paint.id]: paint });
    logger.chat.info(`Updated paint in cache: ${paint.id}`);
  }
};

/**
 * Remove a paint from the cache
 * Used when cosmetic.delete event is received
 */
export const removePaint = (paintId: string) => {
  const currentPaints = chatStore$.paints.peek();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [paintId]: _removed, ...remainingPaints } = currentPaints;
  chatStore$.paints.set(remainingPaints);
  logger.chat.info(`Removed paint from cache: ${paintId}`);

  // Also remove any user associations with this paint
  const currentUserPaintIds = chatStore$.userPaintIds.peek();
  const updatedUserPaintIds = Object.fromEntries(
    Object.entries(currentUserPaintIds).filter(
      ([, userPaintId]) => userPaintId !== paintId,
    ),
  );
  chatStore$.userPaintIds.set(updatedUserPaintIds);
};

/**
 * Remove a user's paint association
 * Used when entitlement.delete event is received
 */
export const removeUserPaint = (ttvUserId: string) => {
  const currentUserPaintIds = chatStore$.userPaintIds.peek();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [ttvUserId]: _removed, ...remainingUserPaintIds } =
    currentUserPaintIds;
  chatStore$.userPaintIds.set(remainingUserPaintIds);
  logger.chat.info(`Removed paint association for user: ${ttvUserId}`);
};

/**
 * Clear all paints and their user mappings
 */
export const clearPaints = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
  });
  logger.chat.info('Cleared all paints from cache');
};

/**
 * Clear all 7TV badges and their user mappings
 */
export const clearSevenTvBadges = () => {
  batch(() => {
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
  logger.chat.info('Cleared all 7TV badges from cache');
};

/**
 * Clear all paints and badges (useful when leaving a channel)
 */
export const clearPaintsAndBadges = () => {
  batch(() => {
    chatStore$.paints.set({});
    chatStore$.userPaintIds.set({});
    chatStore$.badges.set({});
    chatStore$.userBadgeIds.set({});
  });
  logger.chat.info('Cleared all paints and badges from cache');
};

const personalEmoteFetchPromises = new Map<string, Promise<SanitisedEmote[]>>();

const checkedUsersForPersonalEmotes = new Set<string>();

export const fetchUserPersonalEmotes = async (
  twitchUserId: string,
  channelId: string,
): Promise<SanitisedEmote[]> => {
  if (checkedUsersForPersonalEmotes.has(twitchUserId)) {
    const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
    return cache?.sevenTvPersonalEmotes?.[twitchUserId] || [];
  }

  const existingPromise = personalEmoteFetchPromises.get(twitchUserId);
  if (existingPromise) {
    return existingPromise;
  }

  const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
  if (cache?.sevenTvPersonalEmotes?.[twitchUserId]?.length) {
    checkedUsersForPersonalEmotes.add(twitchUserId);
    return cache.sevenTvPersonalEmotes[twitchUserId];
  }

  const fetchPromise = (async (): Promise<SanitisedEmote[]> => {
    try {
      const personalEmotes =
        await sevenTvService.getPersonalEmoteSet(twitchUserId);

      checkedUsersForPersonalEmotes.add(twitchUserId);

      if (personalEmotes.length > 0) {
        const channelCache = chatStore$.persisted.channelCaches[channelId];
        if (channelCache) {
          const currentPersonalEmotes =
            channelCache.sevenTvPersonalEmotes?.peek() || {};
          channelCache.sevenTvPersonalEmotes.set({
            ...currentPersonalEmotes,
            [twitchUserId]: personalEmotes,
          });
          logger.stv.info(
            `Cached ${personalEmotes.length} personal emotes for user ${twitchUserId}`,
          );
        }
      }

      return personalEmotes;
    } catch (error) {
      logger.stv.error(
        `Failed to fetch personal emotes for user ${twitchUserId}:`,
        error,
      );
      checkedUsersForPersonalEmotes.add(twitchUserId);
      return [];
    } finally {
      personalEmoteFetchPromises.delete(twitchUserId);
    }
  })();

  personalEmoteFetchPromises.set(twitchUserId, fetchPromise);
  return fetchPromise;
};

export const getUserPersonalEmotes = (
  twitchUserId: string,
  channelId: string,
): SanitisedEmote[] => {
  const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
  return cache?.sevenTvPersonalEmotes?.[twitchUserId] || [];
};

export const hasCheckedPersonalEmotes = (twitchUserId: string): boolean => {
  return checkedUsersForPersonalEmotes.has(twitchUserId);
};

export const clearPersonalEmotesCache = () => {
  checkedUsersForPersonalEmotes.clear();
  personalEmoteFetchPromises.clear();
  logger.chat.info('Cleared personal emotes cache');
};

export const clearChannelResources = () => {
  batch(() => {
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set([]);
    chatStore$.bits.set([]);
  });
  checkedUsersForPersonalEmotes.clear();
};

/**
 * Notify 7TV about user presence in a channel
 * This allows 7TV to track that the user is viewing the channel
 * @param twitchUserId - The current user's Twitch user ID
 * @param twitchChannelId - The Twitch channel ID the user is viewing
 */
export const notify7TVPresence = async (
  twitchUserId: string | undefined,
  twitchChannelId: string,
): Promise<void> => {
  if (!twitchUserId || !twitchChannelId) {
    logger.stvWs.debug(
      'Skipping 7TV presence notification: missing user or channel ID',
    );
    return;
  }

  try {
    const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
    if (!sevenTvUserId) {
      logger.stvWs.warn(
        `Could not get 7TV user ID for Twitch user: ${twitchUserId}`,
      );
      return;
    }

    await sevenTvService.sendPresence(twitchChannelId, sevenTvUserId);
    logger.stvWs.info(
      `Notified 7TV about presence in channel ${twitchChannelId} for user ${twitchUserId}`,
    );
  } catch (error) {
    logger.stvWs.error(
      `Failed to notify 7TV about presence: ${String(error)}`,
      error,
    );
  }
};

export interface LoadChannelResourcesOptions {
  channelId: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
  twitchUserId?: string;
}

export const loadChannelResources = async (
  options: LoadChannelResourcesOptions | string,
  forceRefresh = false,
): Promise<boolean> => {
  const opts: LoadChannelResourcesOptions =
    typeof options === 'string'
      ? { channelId: options, forceRefresh }
      : options;

  const {
    channelId,
    forceRefresh: shouldForceRefresh = false,
    signal,
    twitchUserId,
  } = opts;

  const startTime = performance.now();
  logger.main.info('🏗️ chatStore loadChannelResources called:', {
    channelId,
    forceRefresh: shouldForceRefresh,
    hasSignal: !!signal,
  });

  if (signal?.aborted) {
    logger.main.info('🚫 Load aborted before starting');
    return false;
  }

  chatStore$.loadingState.set('LOADING');

  try {
    let reason = '';

    if (!shouldForceRefresh) {
      const caches = chatStore$.persisted.channelCaches.peek();
      const existingCache = caches?.[channelId];
      logger.main.info('🗄️ Existing cache check:', {
        channelId,
        hasCache: !!existingCache,
      });

      if (!existingCache) {
        reason = 'No persisted state found';
      } else {
        const cacheAge = Date.now() - existingCache.lastUpdated;

        const hasEmptyEmotes =
          (existingCache.twitchChannelEmotes?.length || 0) === 0 &&
          (existingCache.twitchGlobalEmotes?.length || 0) === 0 &&
          (existingCache.sevenTvChannelEmotes?.length || 0) === 0 &&
          (existingCache.sevenTvGlobalEmotes?.length || 0) === 0 &&
          (existingCache.ffzChannelEmotes?.length || 0) === 0 &&
          (existingCache.ffzGlobalEmotes?.length || 0) === 0 &&
          (existingCache.bttvChannelEmotes?.length || 0) === 0 &&
          (existingCache.bttvGlobalEmotes?.length || 0) === 0;

        const missingEmoteSetId = !existingCache.sevenTvEmoteSetId;

        logger.main.info('📊 Cache validation:', {
          cacheAge: Math.round(cacheAge / (60 * 1000)),
          hasEmptyEmotes,
          missingEmoteSetId,
        });

        if (hasEmptyEmotes) {
          reason = 'Cached data has empty emote lists';
        } else if (cacheAge >= CACHE_DURATION) {
          reason = `Cache expired (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`;
        } else {
          logger.main.info('✅ Using cached data');

          if (missingEmoteSetId) {
            if (signal?.aborted) {
              logger.main.info('🚫 Load aborted before 7TV set ID fetch');
              return false;
            }

            try {
              const sevenTvSetId =
                await sevenTvService.getEmoteSetId(channelId);

              if (signal?.aborted) {
                logger.main.info('🚫 Load aborted after 7TV set ID fetch');
                return false;
              }

              const channelCache =
                chatStore$.persisted.channelCaches[channelId];
              if (channelCache) {
                channelCache.assign({
                  sevenTvEmoteSetId: sevenTvSetId,
                });
              }
            } catch (error) {
              if (signal?.aborted) {
                logger.main.info('🚫 Load aborted (7TV set ID fetch failed)');
                return false;
              }
              logger.chat.warn(
                'Failed to get 7TV emote set ID for cached data:',
                error,
              );
            }
          }

          batch(() => {
            chatStore$.currentChannelId.set(channelId);
            chatStore$.loadingState.set('COMPLETED');
          });

          // Notify 7TV about user presence
          if (twitchUserId) {
            void notify7TVPresence(twitchUserId, channelId);
          }

          const totalDuration = performance.now() - startTime;
          logger.performance.debug(
            `⏳ Load channel resources (from cache) ${channelId} -- time: ${totalDuration.toFixed(2)} ms`,
          );
          return true;
        }
      }
    } else {
      reason = 'Force refresh requested';
    }

    logger.main.info('🌐 Fetching from APIs, reason:', reason);
    chatStore$.currentChannelId.set(channelId);

    if (signal?.aborted) {
      logger.main.info('🚫 Load aborted before API fetch');
      chatStore$.loadingState.set('IDLE');
      return false;
    }

    let sevenTvSetId = 'global';
    try {
      sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
    } catch (error) {
      logger.chat.warn('Failed to get 7TV emote set ID:', error);
    }

    if (signal?.aborted) {
      logger.main.info('🚫 Load aborted after 7TV set ID fetch');
      chatStore$.loadingState.set('IDLE');
      return false;
    }

    const parallelFetchStart = performance.now();
    const [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      bttvGlobalEmotes,
      bttvChannelEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      twitchChannelBadges,
      twitchGlobalBadges,
      ffzGlobalBadges,
      ffzChannelBadges,
      chatterinoBadges,
    ] = await Promise.allSettled([
      sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
      sevenTvService.getSanitisedEmoteSet('global'),
      twitchEmoteService.getChannelEmotes(channelId),
      twitchEmoteService.getGlobalEmotes(),
      bttvEmoteService.getSanitisedGlobalEmotes(),
      bttvEmoteService.getSanitisedChannelEmotes(channelId),
      ffzService.getSanitisedChannelEmotes(channelId),
      ffzService.getSanitisedGlobalEmotes(),
      twitchBadgeService.listSanitisedChannelBadges(channelId),
      twitchBadgeService.listSanitisedGlobalBadges(),
      ffzService.getSanitisedGlobalBadges(),
      ffzService.getSanitisedChannelBadges(channelId),
      chatterinoService.listSanitisedBadges(),
    ]);

    if (signal?.aborted) {
      logger.main.info('🚫 Load aborted after API fetch - discarding results');
      chatStore$.loadingState.set('IDLE');
      return false;
    }

    const parallelFetchDuration = performance.now() - parallelFetchStart;
    logger.performance.debug(
      `⏳ Parallel API fetch (13 services) -- time: ${parallelFetchDuration.toFixed(2)} ms`,
    );

    const getValue = <T>(result: PromiseSettledResult<T[]>): T[] =>
      result.status === 'fulfilled' ? result.value : [];

    const deduplicateById = <T extends { id: string }>(items: T[]): T[] =>
      Array.from(new Map(items.map(item => [item.id, item])).values());

    const allEmotesRaw = [
      ...getValue(sevenTvChannelEmotes),
      ...getValue(sevenTvGlobalEmotes),
      ...getValue(twitchChannelEmotes),
      ...getValue(twitchGlobalEmotes),
      ...getValue(bttvGlobalEmotes),
      ...getValue(bttvChannelEmotes),
      ...getValue(ffzChannelEmotes),
      ...getValue(ffzGlobalEmotes),
    ] satisfies SanitisedEmote[];

    const allEmotes = deduplicateById(allEmotesRaw);

    const allBadgesRaw = [
      ...getValue(twitchChannelBadges),
      ...getValue(twitchGlobalBadges),
      ...getValue(ffzGlobalBadges),
      ...getValue(ffzChannelBadges),
      ...getValue(chatterinoBadges),
    ] satisfies SanitisedBadgeSet[];

    const allBadges = deduplicateById(allBadgesRaw);

    if (signal?.aborted) {
      logger.main.info('🚫 Load aborted before committing to store');
      chatStore$.loadingState.set('IDLE');
      return false;
    }

    const channelData: ChannelCacheType = {
      emotes: allEmotes,
      badges: allBadges,
      lastUpdated: Date.now(),
      twitchChannelEmotes: deduplicateById(getValue(twitchChannelEmotes)),
      twitchGlobalEmotes: deduplicateById(getValue(twitchGlobalEmotes)),
      sevenTvChannelEmotes: deduplicateById(getValue(sevenTvChannelEmotes)),
      sevenTvGlobalEmotes: deduplicateById(getValue(sevenTvGlobalEmotes)),
      bttvGlobalEmotes: deduplicateById(getValue(bttvGlobalEmotes)),
      bttvChannelEmotes: deduplicateById(getValue(bttvChannelEmotes)),
      ffzChannelEmotes: deduplicateById(getValue(ffzChannelEmotes)),
      ffzGlobalEmotes: deduplicateById(getValue(ffzGlobalEmotes)),
      twitchChannelBadges: deduplicateById(getValue(twitchChannelBadges)),
      twitchGlobalBadges: deduplicateById(getValue(twitchGlobalBadges)),
      ffzGlobalBadges: deduplicateById(getValue(ffzGlobalBadges)),
      ffzChannelBadges: deduplicateById(getValue(ffzChannelBadges)),
      chatterinoBadges: deduplicateById(getValue(chatterinoBadges)),
      sevenTvPersonalBadges: {},
      sevenTvPersonalEmotes: {},
      sevenTvEmoteSetId: sevenTvSetId !== 'global' ? sevenTvSetId : undefined,
    };

    batch(() => {
      const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};
      const updatedCaches = limitChannelCaches(
        { ...currentCaches, [channelId]: channelData },
        channelId,
      );
      chatStore$.persisted.channelCaches.set(updatedCaches);
      chatStore$.loadingState.set('COMPLETED');
    });

    // Notify 7TV about user presence
    if (twitchUserId) {
      void notify7TVPresence(twitchUserId, channelId);
    }

    const totalDuration = performance.now() - startTime;
    logger.performance.debug(
      `⏳ Load channel resources (fresh data) ${channelId} -- time: ${totalDuration.toFixed(2)} ms`,
    );
    logger.chat.info(
      `Loaded ${allEmotes.length} emotes and ${allBadges.length} badges`,
    );

    cacheEmoteImages(allEmotes, signal).catch(error => {
      if (!signal?.aborted) {
        logger.chat.warn('Background emote image caching failed:', error);
      }
    });

    return true;
  } catch (error) {
    if (signal?.aborted) {
      logger.main.info('🚫 Load aborted (caught error)');
      chatStore$.loadingState.set('IDLE');
      return false;
    }

    logger.chat.error('Error loading channel resources:', error);
    chatStore$.loadingState.set('ERROR');
    return false;
  }
};

export const getCacheAge = (channelId: string): number | null => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  if (!cache) return null;
  return Date.now() - cache.lastUpdated;
};

export const isCacheExpired = (
  channelId: string,
  maxAge = CACHE_DURATION,
): boolean => {
  const cacheAge = getCacheAge(channelId);
  if (cacheAge === null) return true;
  return cacheAge > maxAge;
};

export const expireCache = (channelId?: string) => {
  if (channelId) {
    const caches = chatStore$.persisted.channelCaches.peek();
    if (caches?.[channelId]) {
      const channelCache = chatStore$.persisted.channelCaches[channelId];
      if (channelCache) {
        channelCache.lastUpdated.set(0);
      }
    }
  } else {
    const caches = chatStore$.persisted.channelCaches.peek() ?? {};
    Object.keys(caches).forEach(id => {
      const cache = chatStore$.persisted.channelCaches[id];
      if (cache) {
        cache.lastUpdated.set(0);
      }
    });
    chatStore$.persisted.lastGlobalUpdate.set(0);
  }
};

export const clearCache = (channelId?: string) => {
  if (channelId) {
    batch(() => {
      const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [channelId]: _, ...rest } = currentCaches;
      chatStore$.persisted.channelCaches.set(rest);

      if (chatStore$.currentChannelId.peek() === channelId) {
        chatStore$.currentChannelId.set(null);
      }
    });
  } else {
    batch(() => {
      chatStore$.persisted.channelCaches.set({});
      chatStore$.persisted.lastGlobalUpdate.set(0);
      chatStore$.currentChannelId.set(null);
      chatStore$.loadingState.set('IDLE');
    });
  }
};

export const clearAllCache = () => {
  batch(() => {
    chatStore$.persisted.channelCaches.set({});
    chatStore$.persisted.lastGlobalUpdate.set(0);
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set([]);
    chatStore$.bits.set([]);
    chatStore$.ttvUsers.set([]);
    chatStore$.messages.set([]);
  });
  clearEmoteImageCache();
  logger.chat.info('All chat cache cleared successfully');
};

/**
 * Cache an emote image URL to disk asynchronously
 * Returns the cached file URI if successful, or the original URL on failure
 * Uses deduping to prevent multiple simultaneous downloads of the same URL
 */
export const cacheEmoteImage = async (emoteUrl: string): Promise<string> => {
  // already cached
  if (
    !emoteUrl ||
    emoteUrl.startsWith('data:') ||
    emoteUrl.startsWith('file://')
  ) {
    return emoteUrl;
  }

  const existingFileUri = getCachedImageUri(emoteUrl);
  if (existingFileUri) {
    return existingFileUri;
  }

  const inProgress = emoteImageCachePromises.get(emoteUrl);
  if (inProgress) {
    return inProgress;
  }

  const cachePromise = (async () => {
    try {
      const fileUri = await cacheImageFromUrl(emoteUrl);
      emoteImageCachePromises.delete(emoteUrl);
      return fileUri;
    } catch (error) {
      emoteImageCachePromises.delete(emoteUrl);
      logger.chat.warn(
        `Failed to cache emote image ${emoteUrl.substring(0, 50)}...:`,
        error,
      );
      return emoteUrl; // Fallback to original URL
    }
  })();

  emoteImageCachePromises.set(emoteUrl, cachePromise);
  return cachePromise;
};

/**
 * Get the cached file URI for an emote URL synchronously
 * Returns the cached URI if available, otherwise the original URL
 */
export const getCachedEmoteUri = (emoteUrl: string): string => {
  if (
    !emoteUrl ||
    emoteUrl.startsWith('data:') ||
    emoteUrl.startsWith('file://')
  ) {
    return emoteUrl;
  }

  const cachedUri = getCachedImageUri(emoteUrl);
  return cachedUri ?? emoteUrl;
};

/**
 * Cache multiple emote images with abort support
 * This is called after loading channel resources to pre-cache all emote images
 * Respects the AbortSignal to stop caching when navigating away
 */
export const cacheEmoteImages = async (
  emotes: SanitisedEmote[],
  signal?: AbortSignal,
): Promise<void> => {
  if (emotes.length === 0) return;

  // Check abort before starting
  if (signal?.aborted) {
    logger.chat.info('🚫 Emote image caching aborted before starting');
    return;
  }

  const startTime = performance.now();
  const urls = emotes.map(e => e.url).filter(Boolean);

  // Filter out already cached URLs
  const urlsToCache = urls.filter(url => {
    if (url.startsWith('data:') || url.startsWith('file://')) {
      return false;
    }
    if (getCachedImageUri(url)) {
      return false;
    }
    return true;
  });

  if (urlsToCache.length === 0) {
    logger.chat.debug('All emote images already cached');
    return;
  }

  logger.chat.info(
    `Starting background cache of ${urlsToCache.length} emote images...`,
  );

  // Cache in batches to allow abort checks between batches
  const BATCH_SIZE = 20;
  let cachedCount = 0;

  for (let i = 0; i < urlsToCache.length; i += BATCH_SIZE) {
    // Check abort before each batch
    if (signal?.aborted) {
      logger.chat.info(
        `🚫 Emote image caching aborted after ${cachedCount}/${urlsToCache.length} images`,
      );
      return;
    }

    const urlBatch = urlsToCache.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop -- Intentional: sequential batches with abort checks
    await Promise.allSettled(urlBatch.map(url => cacheEmoteImage(url)));
    cachedCount += urlBatch.length;
  }

  const duration = performance.now() - startTime;
  logger.performance.debug(
    `⏳ Cached ${urlsToCache.length} emote images -- time: ${duration.toFixed(2)} ms`,
  );
};

export const clearEmoteImageCache = (): void => {
  emoteImageCachePromises.clear();
  clearSessionCache();
  logger.chat.info('Emote image cache cleared');
};

export const refreshChannelResources = async (
  channelId: string,
  forceRefresh = false,
  twitchUserId?: string,
): Promise<boolean> => {
  if (forceRefresh) {
    clearCache(channelId);
  }
  return loadChannelResources({ channelId, forceRefresh, twitchUserId });
};

export const getCurrentEmoteData = (channelId?: string) => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();
  if (!targetChannelId) {
    return emptyEmoteData;
  }

  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];
  if (!cache) {
    return emptyEmoteData;
  }

  const preferences = usePreferences.getState();

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? [])
      : [],
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? [])
      : [],
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? [])
      : [],
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? [])
      : [],
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? [])
      : [],
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? [])
      : [],
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? [])
      : [],
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? [])
      : [],
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? [])
      : [],
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? [])
      : [],
    chatterinoBadges: preferences.showChatterinoEmotes
      ? (cache.chatterinoBadges ?? [])
      : [],
  };
};

export const getSevenTvEmoteSetId = (channelId?: string): string | null => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();
  if (!targetChannelId) {
    return null;
  }

  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];
  return cache?.sevenTvEmoteSetId ?? null;
};

export const updateSevenTvEmotes = (
  channelId: string,
  added: SanitisedEmote[],
  removed: SanitisedEmote[],
) => {
  logger.chat.info(
    `Updating SevenTV emotes for channel ${channelId}: +${added.length} -${removed.length}`,
  );

  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  if (!cache) {
    logger.chat.warn(
      `No channel cache found for ${channelId}, skipping emote update`,
    );
    return;
  }

  const currentEmotes = cache.sevenTvChannelEmotes ?? [];
  const emotesAfterRemoval = currentEmotes.filter(
    (emote: SanitisedEmote) =>
      !removed.some((r: SanitisedEmote) => r.id === emote.id),
  );
  const updatedEmotes = [...emotesAfterRemoval, ...added];

  batch(() => {
    const channelCache = chatStore$.persisted.channelCaches[channelId];
    if (channelCache) {
      channelCache.sevenTvChannelEmotes.set(updatedEmotes);
      channelCache.lastUpdated.set(Date.now());
    }
  });
};

export const getCachedEmotes = (channelId: string): SanitisedEmote[] => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  return cache?.emotes ?? [];
};

export const getCachedBadges = (channelId: string): SanitisedBadgeSet[] => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  return cache?.badges ?? [];
};

export const useLoadingState = () => useSelector(chatStore$.loadingState);

export const useCurrentChannelId = () =>
  useSelector(chatStore$.currentChannelId);

export const useMessages = () => useSelector(chatStore$.messages);

export const useTtvUsers = () => useSelector(chatStore$.ttvUsers);

export const useBits = () => useSelector(chatStore$.bits);

export const useEmojis = () => useSelector(chatStore$.emojis);

export const useCurrentEmoteData = () => {
  const channelId = useSelector(chatStore$.currentChannelId);
  const caches = useSelector(chatStore$.persisted.channelCaches);
  const preferences = usePreferences();

  if (!channelId) {
    return emptyEmoteData;
  }

  const cache = caches?.[channelId];
  if (!cache) {
    return emptyEmoteData;
  }

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? [])
      : [],
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? [])
      : [],
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? [])
      : [],
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? [])
      : [],
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? [])
      : [],
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? [])
      : [],
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? [])
      : [],
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? [])
      : [],
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? [])
      : [],
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? [])
      : [],
    chatterinoBadges: preferences.showChatterinoEmotes
      ? (cache.chatterinoBadges ?? [])
      : [],
  };
};

export const useChannelEmoteData = (channelId: string | null) => {
  const caches = useSelector(chatStore$.persisted.channelCaches);
  const preferences = usePreferences();

  if (!channelId) {
    return emptyEmoteData;
  }

  const cache = caches?.[channelId];
  if (!cache) {
    return emptyEmoteData;
  }

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? [])
      : [],
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? [])
      : [],
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? [])
      : [],
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? [])
      : [],
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? [])
      : [],
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? [])
      : [],
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? [])
      : [],
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? [])
      : [],
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? [])
      : [],
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? [])
      : [],
    chatterinoBadges: preferences.showChatterinoEmotes
      ? (cache.chatterinoBadges ?? [])
      : [],
  };
};

/**
 * Hook to get all paints cache (keyed by paint ID)
 */
export const usePaints = () => useSelector(chatStore$.paints);

/**
 * Hook to get user paint ID mappings (keyed by Twitch user ID)
 */
export const useUserPaintIds = () => useSelector(chatStore$.userPaintIds);

/**
 * Hook to get resolved user paints (keyed by Twitch user ID)
 * Merges userPaintIds with paints to get the full paint data for each user
 */
export const useUserPaints = (): Record<string, UserPaint> => {
  const paints = useSelector(chatStore$.paints);
  const userPaintIds = useSelector(chatStore$.userPaintIds);

  return Object.entries(userPaintIds).reduce<Record<string, UserPaint>>(
    (resolved, [userId, paintId]) => {
      const paint = paints[paintId];
      if (paint) {
        resolved[userId] = { ...paint, ttv_user_id: userId };
      }
      return resolved;
    },
    {},
  );
};

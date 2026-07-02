import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';
import type { SevenTvEventData } from '@app/types/seventv/cosmetics';
import type { SevenTvEmote } from '@app/types/seventv/emotes';
import type { StvUser } from '@app/types/seventv/users';
import { logger } from '@app/utils/logger';

export const HISTORICAL_EVENT_BUFFER = 10000; // 10 seconds

export interface EmoteUpdateCallbackData {
  added: SanitisedEmote[];
  removed: SanitisedEmote[];
  channelId: string;
}

export interface EmoteSyncDeps {
  expectedEmoteSetId: string | undefined;
  connectionTimestamp: number | null;
  channelId: string | undefined;
  onEmoteUpdate: ((data: EmoteUpdateCallbackData) => void) | undefined;
}

export function toSanitisedSevenTvEmote(
  emote: SevenTvEmote,
  actor: StvUser | undefined,
): SanitisedEmote {
  const bestFile =
    emote.data.host.files.find(file => file.name === '4x.avif') ||
    emote.data.host.files.find(file => file.name === '3x.avif') ||
    emote.data.host.files.find(file => file.name === '2x.avif') ||
    emote.data.host.files.find(file => file.name === '1x.avif');

  return {
    name: emote.name,
    id: emote.id,
    url: `https://cdn.7tv.app/emote/${emote.id}/${bestFile?.name ?? '1x.avif'}`,
    original_name: emote.data.name,
    creator:
      (emote.data.owner?.display_name || emote.data.owner?.username) ??
      'UNKNOWN',
    emote_link: `https://7tv.app/emotes/${emote.id}`,
    site: '7TV Channel' as const,
    frame_count: bestFile?.frame_count ?? 1,
    format: bestFile?.format ?? 'avif',
    flags: emote.data.flags,
    aspect_ratio:
      bestFile && bestFile.height > 0 ? bestFile.width / bestFile.height : 1,
    // eslint-disable-next-line no-bitwise
    zero_width: Boolean(emote.data.flags & 256),
    width: bestFile?.width ?? 0,
    height: bestFile?.height ?? 0,
    set_metadata: {
      setId: '',
      setName: '',
      capacity: null,
      ownerId: null,
      kind: EmoteSetKind.Normal,
      updatedAt: new Date().toISOString(),
      totalCount: 0,
    },
    actor,
  };
}

export function isActiveEmoteSetUpdate(
  data: SevenTvEventData<'emote_set.update'>,
  expectedEmoteSetId: string | undefined,
): boolean {
  const receivedEmoteSetId = data.body.id;

  if (!expectedEmoteSetId || !receivedEmoteSetId) {
    return false;
  }

  if (receivedEmoteSetId !== expectedEmoteSetId) {
    logger.stvWs.debug(
      `Ignoring 7TV emote_set.update for ${receivedEmoteSetId}; active set is ${expectedEmoteSetId}`,
    );
    return false;
  }

  return true;
}

export function handleEmoteSetUpdate(
  data: SevenTvEventData<'emote_set.update'>,
  deps: EmoteSyncDeps,
): void {
  try {
    if (!isActiveEmoteSetUpdate(data, deps.expectedEmoteSetId)) {
      return;
    }

    if (deps.connectionTimestamp) {
      const timeSinceConnection = Date.now() - deps.connectionTimestamp;

      if (timeSinceConnection < HISTORICAL_EVENT_BUFFER) {
        logger.stvWs.info(
          '💚 Ignoring potential historical emote set update event (within buffer period)',
        );
        return;
      }
    }

    const addedEmotes: SanitisedEmote[] = [];
    const removedEmotes: SanitisedEmote[] = [];
    const { body } = data;

    if (body.pushed) {
      body.pushed.forEach(emote => {
        addedEmotes.push(toSanitisedSevenTvEmote(emote.value, body.actor));
      });
    }

    if (body.pulled) {
      body.pulled.forEach(emote => {
        if (emote && emote.old_value) {
          removedEmotes.push(
            toSanitisedSevenTvEmote(emote.old_value, body.actor),
          );
        }
      });
    }

    if (body.updated) {
      body.updated.forEach(emote => {
        if (emote.old_value) {
          removedEmotes.push(
            toSanitisedSevenTvEmote(emote.old_value, body.actor),
          );
        }
        addedEmotes.push(toSanitisedSevenTvEmote(emote.value, body.actor));
      });
    }

    if (addedEmotes.length > 0 || removedEmotes.length > 0) {
      logger.stvWs.info(
        `💚 Processing emote set update: +${addedEmotes.length} -${removedEmotes.length} emotes`,
      );

      if (deps.onEmoteUpdate) {
        deps.onEmoteUpdate({
          added: addedEmotes,
          removed: removedEmotes,
          channelId: deps.channelId || '',
        });
      }
    }
  } catch (error) {
    logger.stvWs.error('Error handling emote set update:', error);
  }
}

import type { SevenTvEventData } from '@app/types/seventv/cosmetics';
import type { SevenTvEmote, SevenTvFile } from '@app/types/seventv/emotes';
import type { StvUser } from '@app/types/seventv/users';

type EmoteChange = SevenTvEmote & { origin_id: string | null };

type EmoteSetUpdateBody = SevenTvEventData<'emote_set.update'>['body'];

export function createSevenTvFile(overrides: {
  name: string;
  width: number;
  height: number;
  frame_count?: number;
  format?: string;
}): SevenTvFile {
  return {
    name: overrides.name,
    static_name: overrides.name,
    width: overrides.width,
    height: overrides.height,
    frame_count: overrides.frame_count ?? 1,
    size: 1024,
    format: overrides.format ?? 'AVIF',
  };
}

export function createSevenTvEmote(overrides: {
  id: string;
  name: string;
  originalName?: string;
  flags?: number;
  files?: SevenTvFile[];
}): EmoteChange {
  return {
    id: overrides.id,
    name: overrides.name,
    flags: 0,
    timestamp: 1750000000000,
    actor_id: 'stv-actor-1',
    origin_id: null,
    data: {
      id: overrides.id,
      name: overrides.originalName ?? overrides.name,
      flags: overrides.flags ?? 0,
      lifecycle: 3,
      state: ['LISTED'],
      listed: true,
      animated: true,
      owner: {
        id: 'stv-owner-1',
        username: 'emoteauthor',
        display_name: 'EmoteAuthor',
        style: {},
        role_ids: [],
        connection: [],
      },
      host: {
        url: `//cdn.7tv.app/emote/${overrides.id}`,
        files: overrides.files ?? [
          createSevenTvFile({ name: '1x.avif', width: 32, height: 32 }),
          createSevenTvFile({
            name: '4x.avif',
            width: 128,
            height: 128,
            frame_count: 60,
          }),
        ],
      },
    },
  };
}

export function createStvActor(): StvUser {
  return {
    id: 'stv-actor-1',
    username: 'moduser',
    display_name: 'ModUser',
    avatar_url: 'https://cdn.7tv.app/avatar.png',
    style: {},
    role_ids: [],
    connection: [],
  };
}

export function createPushedChange(
  emote: EmoteChange,
): NonNullable<EmoteSetUpdateBody['pushed']>[number] {
  return {
    key: 'emotes',
    index: 0,
    old_value: null,
    value: emote,
  };
}

export function createPulledChange(
  emote: EmoteChange,
): NonNullable<EmoteSetUpdateBody['pulled']>[number] {
  return {
    key: 'emotes',
    index: 0,
    old_value: emote,
    value: emote,
  };
}

export function createUpdatedChange(
  oldEmote: EmoteChange,
  newEmote: EmoteChange,
): NonNullable<EmoteSetUpdateBody['updated']>[number] {
  return {
    key: 'emotes',
    index: 0,
    old_value: oldEmote,
    value: newEmote,
  };
}

export function createEmoteSetUpdateEvent(
  body: Partial<EmoteSetUpdateBody> & { id: string },
): SevenTvEventData<'emote_set.update'> {
  return {
    type: 'emote_set.update',
    body: {
      kind: 2,
      ...body,
    },
  };
}

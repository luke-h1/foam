import {
  type EmoteSetCustomQuery,
  EmoteSetKind,
  type GlobalEmoteSetQuery,
  type UserPersonalEmotesQueryQuery,
} from '@app/graphql/generated/gql';

type V4EmoteSet = NonNullable<EmoteSetCustomQuery['emoteSets']['emoteSet']>;
type V4EmoteSetItem = V4EmoteSet['emotes']['items'][number];
type V4Image = V4EmoteSetItem['emote']['images'][number];

function v4Image(overrides: Partial<V4Image> & Pick<V4Image, 'url'>): V4Image {
  return {
    mime: 'image/avif',
    size: 1000,
    scale: 1,
    width: 32,
    height: 32,
    frameCount: 1,
    ...overrides,
  };
}

const animatedItem: V4EmoteSetItem = {
  id: 'item-a',
  alias: 'PagMan',
  addedById: null,
  emote: {
    id: 'emote-a',
    defaultName: 'PagManOriginal',
    tags: [],
    aspectRatio: 1,
    flags: { animated: true, defaultZeroWidth: false },
    images: [
      v4Image({
        url: 'https://cdn.7tv.app/emote/emote-a/1x.avif',
        frameCount: 10,
      }),
      v4Image({
        url: 'https://cdn.7tv.app/emote/emote-a/1x.webp',
        mime: 'image/webp',
        frameCount: 10,
      }),
      v4Image({
        url: 'https://cdn.7tv.app/emote/emote-a/4x.avif',
        scale: 4,
        width: 128,
        height: 96,
        frameCount: 10,
      }),
      v4Image({
        url: 'https://cdn.7tv.app/emote/emote-a/4x.webp',
        mime: 'image/webp',
        scale: 4,
        width: 128,
        height: 96,
        frameCount: 10,
      }),
      v4Image({
        url: 'https://cdn.7tv.app/emote/emote-a/4x_static.avif',
        scale: 4,
        width: 128,
        height: 96,
      }),
    ],
    owner: {
      id: 'owner-a',
      mainConnection: { platformDisplayName: 'CreatorA' },
    },
  },
  flags: { zeroWidth: false },
};

const zeroWidthStaticItem: V4EmoteSetItem = {
  id: 'item-b',
  alias: 'SoSnowy',
  addedById: null,
  emote: {
    id: 'emote-b',
    defaultName: 'SoSnowy',
    tags: [],
    aspectRatio: 1,
    flags: { animated: false, defaultZeroWidth: false },
    images: [
      v4Image({ url: 'https://cdn.7tv.app/emote/emote-b/1x.avif' }),
      v4Image({
        url: 'https://cdn.7tv.app/emote/emote-b/4x.avif',
        scale: 4,
        width: 128,
        height: 128,
      }),
    ],
    owner: null,
  },
  flags: { zeroWidth: true },
};

const imagelessItem: V4EmoteSetItem = {
  id: 'item-c',
  alias: 'Ghost',
  addedById: null,
  emote: {
    id: 'emote-c',
    defaultName: 'Ghost',
    tags: [],
    aspectRatio: 1,
    flags: { animated: false, defaultZeroWidth: false },
    images: [],
    owner: null,
  },
  flags: { zeroWidth: false },
};

export const customEmoteSetResponse: EmoteSetCustomQuery = {
  emoteSets: {
    emoteSet: {
      id: 'set-1',
      name: 'Channel Set',
      capacity: 600,
      ownerId: 'owner-1',
      kind: EmoteSetKind.Normal,
      updatedAt: '2026-01-01T00:00:00.000Z',
      emotes: {
        totalCount: 3,
        items: [animatedItem, zeroWidthStaticItem, imagelessItem],
      },
    },
  },
};

export const globalEmoteSetResponse: GlobalEmoteSetQuery = {
  emoteSets: {
    global: {
      id: 'set-global',
      name: 'Global Set',
      capacity: null,
      ownerId: null,
      kind: EmoteSetKind.Global,
      updatedAt: '2026-01-02T00:00:00.000Z',
      emotes: {
        totalCount: 1,
        items: [zeroWidthStaticItem],
      },
    },
  },
};

export const personalEmoteSetResponse: UserPersonalEmotesQueryQuery = {
  users: {
    userByConnection: {
      id: 'stv-user-1',
      personalEmoteSet: {
        id: 'pset-1',
        name: 'Personal',
        emotes: {
          items: [
            {
              id: 'pitem-1',
              alias: '',
              emote: {
                id: 'emote-p',
                defaultName: 'peepoShy',
                flags: {
                  animated: true,
                  approvedPersonal: true,
                  defaultZeroWidth: true,
                },
                images: [
                  v4Image({
                    url: 'https://cdn.7tv.app/emote/emote-p/4x.webp',
                    mime: 'image/webp',
                    scale: 4,
                    width: 256,
                    height: 128,
                    frameCount: 20,
                  }),
                  v4Image({
                    url: 'https://cdn.7tv.app/emote/emote-p/4x_static.avif',
                    scale: 4,
                    width: 256,
                    height: 128,
                  }),
                ],
                owner: {
                  id: 'owner-p',
                  mainConnection: { platformDisplayName: 'CreatorP' },
                },
              },
            },
          ],
        },
      },
    },
  },
};

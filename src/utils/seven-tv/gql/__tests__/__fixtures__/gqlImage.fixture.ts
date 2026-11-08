import type { Image } from '@app/graphql/generated/gql';

export const createGqlImage = (overrides: Partial<Image>): Image => ({
  __typename: 'Image',
  url: 'https://cdn.7tv.app/emote/test/2x.webp',
  mime: 'image/webp',
  scale: 2,
  frameCount: 1,
  size: 0,
  width: 0,
  height: 0,
  ...overrides,
});

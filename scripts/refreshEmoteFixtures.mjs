/**
 * Refreshes the sanitised emote fixtures in src/services/__fixtures__/emotes
 * by calling the real BTTV / FFZ / 7TV / Twitch APIs and applying the same
 * sanitisation logic as the corresponding services:
 *  - src/services/bttv-emote-service.ts
 *  - src/services/ffz-service.ts
 *  - src/services/seventv-service.ts (v4 GQL)
 *  - src/services/twitch-emote-service.ts
 *
 * Channels: sennyk4 (7TV + Twitch channel emotes), zoil (BTTV + FFZ channel emotes).
 * Twitch data comes from the public web GQL endpoint so no Helix token is needed.
 *
 * Usage: node scripts/refreshEmoteFixtures.mjs
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = path.join(root, 'src/services/__fixtures__/emotes');

const ZOIL_TWITCH_ID = '95304188';
const SENNYK4_TWITCH_ID = '146110596';
const SENNYK4_LOGIN = 'sennyk4';

// Public web client id used by twitch.tv itself; only used to read public emote data.
const TWITCH_WEB_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${url} -> HTTP ${res.status}`);
  }
  return res.json();
}

/* ----------------------------- shared helpers ---------------------------- */

// Mirrors createEmoteImageVariants in src/utils/emote/emoteImageVariants.ts
const preferredScales = ['4x', '3x', '2x', '1x'];

function compactVariantSet(variants) {
  if (!variants) return undefined;
  const compacted = {};
  for (const scale of preferredScales) {
    if (variants[scale]) compacted[scale] = variants[scale];
  }
  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function createEmoteImageVariants({ animated, static: staticVariants }) {
  const resolvedAnimated = compactVariantSet(animated);
  const resolvedStatic = compactVariantSet(staticVariants);
  return {
    ...(resolvedAnimated ? { animated: resolvedAnimated } : null),
    ...(resolvedStatic ? { static: resolvedStatic } : null),
  };
}

/* --------------------------------- BTTV ---------------------------------- */

const bttvZeroWidthEmotes = ['cvHazmat', 'cvMask'];

function sanitiseBttvEmote(emote, site, creator) {
  const animatedVariants = {
    '2x': `https://cdn.betterttv.net/emote/${emote.id}/2x`,
    '3x': `https://cdn.betterttv.net/emote/${emote.id}/3x`,
  };
  const staticVariants = emote.animated
    ? {
        '2x': `https://cdn.betterttv.net/emote/${emote.id}/2x.png`,
        '3x': `https://cdn.betterttv.net/emote/${emote.id}/3x.png`,
      }
    : animatedVariants;

  return {
    name: emote.code,
    id: emote.id,
    url: animatedVariants['3x'],
    static_url: staticVariants['3x'],
    image_variants: createEmoteImageVariants({
      animated: animatedVariants,
      static: staticVariants,
    }),
    emote_link: `https://betterttv.com/emotes/${emote.id}`,
    original_name: emote.codeOriginal ?? 'UNKNOWN',
    creator,
    site,
    flags: bttvZeroWidthEmotes.includes(emote.code) ? 256 : undefined,
  };
}

async function fetchBttvGlobal() {
  const result = await getJson(
    'https://api.betterttv.net/3/cached/emotes/global',
  );
  return result.map(emote => sanitiseBttvEmote(emote, 'Global BTTV', null));
}

async function fetchBttvChannel(twitchChannelId) {
  const result = await getJson(
    `https://api.betterttv.net/3/cached/users/twitch/${twitchChannelId}`,
  );
  const toChannelEmote = emote =>
    sanitiseBttvEmote(emote, 'BTTV', emote.user?.name || null);
  return [
    ...result.sharedEmotes.map(toChannelEmote),
    ...result.channelEmotes.map(toChannelEmote),
  ];
}

/* ---------------------------------- FFZ ----------------------------------- */

function toFfzStaticUrl(emoteId, scale) {
  return `https://cdn.frankerfacez.com/emote/${emoteId}/${scale === '2x' ? '2' : '4'}`;
}

function toFfzAnimatedUrl(emoteId, scale) {
  return `https://cdn.frankerfacez.com/emote/${emoteId}/animated/${scale === '2x' ? '2' : '4'}`;
}

function sanitiseFfzEmote(emote, site, creator) {
  const staticVariants = {
    '2x': emote.urls['2'] || toFfzStaticUrl(emote.id, '2x'),
    '4x': emote.urls['4'] || toFfzStaticUrl(emote.id, '4x'),
  };
  const animatedVariants = emote.animated
    ? {
        '2x': toFfzAnimatedUrl(emote.id, '2x'),
        '4x': toFfzAnimatedUrl(emote.id, '4x'),
      }
    : staticVariants;

  return {
    name: emote.name,
    id: emote.id.toString(),
    url: animatedVariants['4x'],
    static_url: staticVariants['4x'],
    image_variants: createEmoteImageVariants({
      animated: animatedVariants,
      static: staticVariants,
    }),
    emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
    creator,
    site,
    original_name: 'UNKNOWN',
    width: emote.width,
    height: emote.height,
    aspect_ratio: emote.height > 0 ? emote.width / emote.height : 1,
  };
}

async function fetchFfzGlobal() {
  const result = await getJson('https://api.frankerfacez.com/v1/set/global');
  return result.sets[result.default_sets[0]].emoticons.map(emote =>
    sanitiseFfzEmote(emote, 'Global FFZ', 'UNKNOWN'),
  );
}

async function fetchFfzChannel(channelId) {
  const result = await getJson(
    `https://api.frankerfacez.com/v1/room/id/${channelId}`,
  );
  const emoteSet = result.sets[result.room.set];
  return (emoteSet?.emoticons ?? []).map(emote =>
    sanitiseFfzEmote(emote, 'FFZ', emote.owner.name ?? 'unknown'),
  );
}

/* --------------------------------- Twitch --------------------------------- */

function toTwitchImageUrl(emoteId, format = 'default', scale = '3.0') {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/${format}/dark/${scale}`;
}

function sanitiseTwitchEmote(emote, site, creator) {
  return {
    name: emote.name,
    id: emote.id,
    url: toTwitchImageUrl(emote.id),
    static_url: toTwitchImageUrl(emote.id, 'static'),
    image_variants: createEmoteImageVariants({
      animated: {
        '2x': toTwitchImageUrl(emote.id, 'default', '2.0'),
        '4x': toTwitchImageUrl(emote.id, 'default', '3.0'),
      },
      static: {
        '2x': toTwitchImageUrl(emote.id, 'static', '2.0'),
        '4x': toTwitchImageUrl(emote.id, 'static', '3.0'),
      },
    }),
    emote_link: toTwitchImageUrl(emote.id),
    creator,
    original_name: emote.name,
    site,
  };
}

async function twitchGql(query) {
  const result = await getJson('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: {
      'Client-ID': TWITCH_WEB_CLIENT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (result.errors?.length) {
    throw new Error(`Twitch GQL: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

async function fetchTwitchGlobal() {
  const data = await twitchGql('query{emoteSet(id:"0"){emotes{id token}}}');
  return data.emoteSet.emotes.map(emote =>
    sanitiseTwitchEmote(
      { id: emote.id, name: emote.token },
      'Twitch Global',
      null,
    ),
  );
}

async function fetchTwitchChannel(login) {
  const data = await twitchGql(
    `query{user(login:"${login}"){displayName subscriptionProducts{emotes{id token}}}}`,
  );
  const broadcaster = data.user.displayName;
  return data.user.subscriptionProducts.flatMap(product =>
    product.emotes.map(emote =>
      sanitiseTwitchEmote(
        { id: emote.id, name: emote.token },
        'Twitch Channel',
        broadcaster,
      ),
    ),
  );
}

/* ---------------------------------- 7TV ----------------------------------- */

const STV_IMAGE_FRAGMENT = `fragment ImageFragment on Image {
  url
  mime
  size
  scale
  width
  height
  frameCount
}`;

const STV_EMOTE_SET_FIELDS = `
  id
  name
  capacity
  ownerId
  kind
  updatedAt
  emotes(page: 1, perPage: 1000) {
    totalCount
    items {
      id
      alias
      addedById
      emote {
        id
        defaultName
        tags
        aspectRatio
        flags {
          animated
          defaultZeroWidth
        }
        images {
          ...ImageFragment
        }
        owner {
          id
          mainConnection {
            platformDisplayName
          }
        }
      }
      flags {
        zeroWidth
      }
    }
  }
`;

async function sevenTvGql(query, variables) {
  const result = await getJson('https://7tv.io/v4/gql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (result.errors?.length) {
    throw new Error(`7TV GQL: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

// Mirrors pickBestFormat / pickBestImage in src/utils/color/sevenTvPaintData.ts
function pickBestFormat(imgs) {
  return (
    imgs.find(img => img.mime === 'image/avif') ??
    imgs.find(img => img.mime === 'image/webp') ??
    imgs[0]
  );
}

function pickBestImage(images) {
  for (const targetScale of [4, 3, 2, 1]) {
    const atScale = images.filter(img => img.scale === targetScale);
    if (atScale.length === 0) return undefined;
    const animated = atScale.filter(img => img.frameCount > 1);
    return animated.length > 0
      ? pickBestFormat(animated)
      : pickBestFormat(atScale);
  }
  return undefined;
}

function pickBestStaticImage(images) {
  for (const targetScale of [4, 3, 2, 1]) {
    const atScale = images.filter(img => img.scale === targetScale);
    if (atScale.length === 0) return undefined;
    const staticImages = atScale.filter(img => img.frameCount <= 1);
    return staticImages.length > 0 ? pickBestFormat(staticImages) : undefined;
  }
  return undefined;
}

function buildV4ImageVariants(images) {
  const variants = { animated: {}, static: {} };
  for (const image of images) {
    const scale = `${image.scale}x`;
    if (!['1x', '2x', '3x', '4x'].includes(scale)) continue;
    if (image.frameCount > 1) {
      variants.animated[scale] = image.url;
    } else {
      variants.static[scale] = image.url;
    }
  }
  return createEmoteImageVariants(variants);
}

// Mirrors sanitiseV4EmoteSet in src/services/seventv-service.ts
function sanitiseV4EmoteSet(emoteSet, site) {
  const setMetadata = {
    setId: emoteSet.id,
    setName: emoteSet.name,
    capacity: emoteSet.capacity ?? null,
    ownerId: emoteSet.ownerId ?? null,
    kind: emoteSet.kind,
    updatedAt: emoteSet.updatedAt,
    totalCount: emoteSet.emotes.totalCount,
  };

  const emotes = emoteSet.emotes.items.map(item => {
    const { emote } = item;
    const bestImage = pickBestImage(emote.images);
    const bestStaticImage = pickBestStaticImage(emote.images);
    const width = bestImage?.width ?? 0;
    const height = bestImage?.height ?? 0;
    const zeroWidth = item.flags.zeroWidth || emote.flags.defaultZeroWidth;

    return {
      name: item.alias,
      id: emote.id,
      url: bestImage?.url ?? '',
      static_url: bestStaticImage?.url,
      image_variants: buildV4ImageVariants(emote.images),
      flags: zeroWidth ? 256 : 0,
      original_name: emote.defaultName,
      creator: emote.owner?.mainConnection?.platformDisplayName ?? null,
      emote_link: `https://7tv.app/emotes/${emote.id}`,
      site,
      frame_count: bestImage?.frameCount ?? 1,
      format: bestImage?.mime?.replace('image/', '') ?? 'webp',
      aspect_ratio: height > 0 ? width / height : 1,
      zero_width: zeroWidth,
      width,
      height,
      set_metadata: '__SET_METADATA__',
    };
  });

  return { setMetadata, emotes };
}

async function fetchSevenTvGlobal() {
  const data = await sevenTvGql(
    `query GlobalEmoteSet { emoteSets { global { ${STV_EMOTE_SET_FIELDS} } } }\n${STV_IMAGE_FRAGMENT}`,
  );
  return sanitiseV4EmoteSet(data.emoteSets.global, '7TV Global');
}

async function fetchSevenTvChannel(twitchChannelId) {
  const user = await getJson(
    `https://7tv.io/v3/users/twitch/${twitchChannelId}`,
  );
  const setId = user.emote_set.id;
  const data = await sevenTvGql(
    `query emoteSetCustom($id: Id!) { emoteSets { emoteSet(id: $id) { ${STV_EMOTE_SET_FIELDS} } } }\n${STV_IMAGE_FRAGMENT}`,
    { id: setId },
  );
  return sanitiseV4EmoteSet(data.emoteSets.emoteSet, '7TV Channel');
}

/* ----------------------------- fixture writing ---------------------------- */

const kindToEnumMember = {
  GLOBAL: 'EmoteSetKind.Global',
  NORMAL: 'EmoteSetKind.Normal',
  PERSONAL: 'EmoteSetKind.Personal',
  SPECIAL: 'EmoteSetKind.Special',
};

function writeFixture(relativePath, content) {
  const filePath = path.join(fixturesDir, relativePath);
  writeFileSync(filePath, content);
  console.log(`wrote ${path.relative(root, filePath)}`);
}

function writeSimpleFixture(relativePath, exportName, type, emotes) {
  const json = JSON.stringify(emotes, null, 2);
  writeFixture(
    relativePath,
    `import type { ${type} } from '@app/types/emote';\n\nexport const ${exportName}: ${type}[] = ${json};\n`,
  );
}

function writeSevenTvFixture(
  relativePath,
  exportName,
  { setMetadata, emotes },
) {
  const kindMember = kindToEnumMember[setMetadata.kind];
  if (!kindMember) {
    throw new Error(`Unknown EmoteSetKind: ${setMetadata.kind}`);
  }
  const metadataJson = JSON.stringify(setMetadata, null, 2).replace(
    `"kind": "${setMetadata.kind}"`,
    `"kind": ${kindMember}`,
  );
  const emotesJson = JSON.stringify(emotes, null, 2).replaceAll(
    '"__SET_METADATA__"',
    'setMetadata',
  );
  writeFixture(
    relativePath,
    `import { EmoteSetKind } from '@app/graphql/generated/gql';\n` +
      `import type { SevenTvSanitisedEmote } from '@app/types/emote';\n\n` +
      `const setMetadata = ${metadataJson} as const;\n\n` +
      `export const ${exportName}: SevenTvSanitisedEmote[] = ${emotesJson};\n`,
  );
}

/* ---------------------------------- main ---------------------------------- */

const [
  bttvGlobal,
  bttvChannel,
  ffzGlobal,
  ffzChannel,
  twitchGlobal,
  twitchChannel,
  stvGlobal,
  stvChannel,
] = await Promise.all([
  fetchBttvGlobal(),
  fetchBttvChannel(ZOIL_TWITCH_ID),
  fetchFfzGlobal(),
  fetchFfzChannel(ZOIL_TWITCH_ID),
  fetchTwitchGlobal(),
  fetchTwitchChannel(SENNYK4_LOGIN),
  fetchSevenTvGlobal(),
  fetchSevenTvChannel(SENNYK4_TWITCH_ID),
]);

console.log(
  `bttv global=${bttvGlobal.length} channel=${bttvChannel.length} | ` +
    `ffz global=${ffzGlobal.length} channel=${ffzChannel.length} | ` +
    `twitch global=${twitchGlobal.length} channel=${twitchChannel.length} | ` +
    `7tv global=${stvGlobal.emotes.length} channel=${stvChannel.emotes.length}`,
);

writeSimpleFixture(
  'bttv/bttvSanitisedGlobalEmoteSet.fixture.ts',
  'bttvSanitisedGlobalEmoteSet',
  'BttvSanitisedEmote',
  bttvGlobal,
);
writeSimpleFixture(
  'bttv/bttvSanitisedChannelEmoteSet.fixture.ts',
  'bttvSanitisedChannelEmoteSet',
  'BttvSanitisedEmote',
  bttvChannel,
);
writeSimpleFixture(
  'ffz/ffzSanitisedGlobalEmoteSet.fixture.ts',
  'ffzSanitisedGlobalEmoteSet',
  'FfzSanitisedEmote',
  ffzGlobal,
);
writeSimpleFixture(
  'ffz/ffzSanitisedChannelEmoteSet.fixture.ts',
  'ffzSanitisedChannelEmoteSet',
  'FfzSanitisedEmote',
  ffzChannel,
);
writeSimpleFixture(
  'twitch/twitchTvSanitisedEmoteSetGlobal.fixture.ts',
  'twitchTvSanitisedEmoteSetGlobalFixture',
  'TwitchSanitisedEmote',
  twitchGlobal,
);
writeSimpleFixture(
  'twitch/twitchTvSanitisedEmoteSetChannel.fixture.ts',
  'twitchTvSanitisedEmoteSetChannelFixture',
  'TwitchSanitisedEmote',
  twitchChannel,
);
writeSevenTvFixture(
  'stv/sevenTvSanitisedGlobalEmoteSet.fixture.ts',
  'seventvSanitiisedGlobalEmoteSetFixture',
  stvGlobal,
);
writeSevenTvFixture(
  'stv/sevenTvSanitisedChannelEmoteSet.fixture.ts',
  'sevenTvSanitisedChannelEmoteSetFixture',
  stvChannel,
);

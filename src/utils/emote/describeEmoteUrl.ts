export type EmoteUrlProvider = '7tv' | 'bttv' | 'ffz' | 'twitch' | 'unknown';

export interface EmoteUrlDescriptor {
  provider: EmoteUrlProvider;
  id: string | null;
  scale: string | null;
  kind: 'animated' | 'static' | null;
}

const sevenTv =
  /^https:\/\/cdn\.7tv\.app\/emote\/([^/]+)\/([1234])x(_static)?\.(?:avif|webp)$/;
const bttv =
  /^https:\/\/cdn\.betterttv\.net\/emote\/([^/]+)\/([123])x(\.png)?$/;
const ffz =
  /^https:\/\/cdn\.frankerfacez\.com\/emote\/([^/]+)\/(animated\/)?([124])$/;
const twitch =
  /^https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v2\/([^/]+)\/(default|static)\/dark\/([123])\.0$/;

export function describeEmoteUrl(url: string): EmoteUrlDescriptor {
  const stv = sevenTv.exec(url);
  if (stv) {
    return {
      provider: '7tv',
      id: stv[1] ?? null,
      scale: stv[2] ? `${stv[2]}x` : null,
      kind: stv[3] ? 'static' : 'animated',
    };
  }

  const b = bttv.exec(url);
  if (b) {
    // BTTV's bare `{n}x` url doesn't encode the kind; only the explicit
    // `.png` variant is reliably static, so leave the bare form unknown.
    return {
      provider: 'bttv',
      id: b[1] ?? null,
      scale: b[2] ? `${b[2]}x` : null,
      kind: b[3] ? 'static' : null,
    };
  }

  const f = ffz.exec(url);
  if (f) {
    return {
      provider: 'ffz',
      id: f[1] ?? null,
      scale: f[3] ?? null,
      // A bare scale URL may still serve animated WebP; leave kind unknown so
      // useAppleWebpCodec never routes animated WebP to ImageIO (fatal hang).
      kind: f[2] ? 'animated' : null,
    };
  }

  const t = twitch.exec(url);
  if (t) {
    return {
      provider: 'twitch',
      id: t[1] ?? null,
      scale: t[3] ? `${t[3]}.0` : null,
      kind: t[2] === 'static' ? 'static' : 'animated',
    };
  }

  return { provider: 'unknown', id: null, scale: null, kind: null };
}

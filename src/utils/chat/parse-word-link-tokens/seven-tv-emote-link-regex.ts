/**
 * Only a v3 ObjectId or a v4 ULID. The 7TV API rejects any other id.
 */
export const SEVEN_TV_EMOTE_LINK_REGEX =
  /https?:\/\/(?:www\.)?7tv\.app\/emotes\/([0-9a-f]{24}|[0-9a-hjkmnp-tv-z]{26})(?![a-z0-9])/i;

/* eslint-disable no-restricted-syntax */
import {
  MessagePart,
  MessageCard,
  MessagePartType,
  TWITCH_CLIP_REGEX,
  MessageCardType,
  TWITCH_VIDEO_REGEX,
  YOUTUBE_VIDEO_REGEX,
} from '../services/types/messages';

const createMessageCard = (
  parts: MessagePart[],
  twitch = true,
  youtube = true,
): MessageCard | null => {
  if (!twitch && !youtube) return null;

  for (const part of parts) {
    // eslint-disable-next-line no-continue
    if (part.type !== MessagePartType.LINK) continue;

    if (twitch) {
      let m = TWITCH_CLIP_REGEX.exec(part.content.displayText);

      if (m) {
        return {
          type: MessageCardType.TWITCH_CLIP,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          id: m[1],
          url: part.content.url,
        };
      }

      m = TWITCH_VIDEO_REGEX.exec(part.content.displayText);

      if (m) {
        return {
          type: MessageCardType.TWITCH_VIDEO,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          id: m[1],
          url: part.content.url,
        };
      }
    }

    if (youtube) {
      const m = YOUTUBE_VIDEO_REGEX.exec(part.content.displayText);

      if (m) {
        return {
          type: MessageCardType.YOUTUBE_VIDEO,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          id: m[4],
          url: part.content.url,
        };
      }
    }
  }

  return null;
};

export default createMessageCard;

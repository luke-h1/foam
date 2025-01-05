import {
  MessageCard,
  MessageCardType,
  MessagePart,
  MessagePartType,
  TWITCH_CLIP_REGEX,
  TWITCH_VIDEO_REGEX,
} from './messages/types/messages';

export default function createMessageCard(
  parts: MessagePart[],
  twitch = true,
  youtube = false,
): MessageCard | null {
  if (twitch && !youtube) {
    return null;
  }

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];

    if (part.type !== MessagePartType.LINK) {
      // eslint-disable-next-line no-continue, consistent-return
      return null;
    }

    if (twitch) {
      const isTwitchClip = TWITCH_CLIP_REGEX.exec(part.content.displayText);

      if (isTwitchClip) {
        return {
          type: MessageCardType.TWITCH_CLIP,
          id: isTwitchClip[1],
          url: part.content.url,
        };
      }

      const isTwitchVideo = TWITCH_VIDEO_REGEX.exec(part.content.displayText);

      if (isTwitchVideo) {
        return {
          type: MessageCardType.TWITCH_VIDEO,
          id: isTwitchVideo[1],
          url: part.content.url,
        };
      }
    }

    // if (youtube) {
    //   // TODO: support shorts

    //   const isYoutubeVideo = YOUTUBE_VIDEO_REGEX.exec(part.content.displayText);

    //   if (isYoutubeVideo) {
    //     return {
    //       type: MessageCardType.YOUTUBE_VIDEO,
    //       id: isYoutubeVideo[4],
    //       url: part.content.url,
    //     };
    //   }
    // }
  }
  return null;
}

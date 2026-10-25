import { MediaLinkCard } from '@app/components/chat/components/media-link-card/MediaLinkCard';
import type {
  MediaLinkTokenKind,
  MessageToken,
} from '@app/utils/chat/messageToken';

interface MediaLinkTokenProps {
  token: MessageToken<MediaLinkTokenKind>;
}

/**
 * A pasted link that chat draws as a preview card: a 7TV emote link or a
 * Twitch clip. The 7TV card sits inline with the surrounding text.
 */
export function MediaLinkToken({ token }: MediaLinkTokenProps) {
  if (!token.content.trim()) {
    return null;
  }

  if (token.type === 'stvEmoteLink') {
    return (
      <MediaLinkCard
        layout='inline'
        type='stvEmoteLink'
        {...{ thumbnail: token.thumbnail, url: token.content }}
      />
    );
  }

  return (
    <MediaLinkCard
      type='twitchClip'
      {...{ thumbnail: token.thumbnail, url: token.content }}
    />
  );
}

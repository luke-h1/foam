import { MediaLinkCard } from '@app/components/chat/components/media-link-card/media-link-card';
import type {
  MediaLinkTokenKind,
  MessageToken,
} from '@app/utils/chat/message-token';

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
        thumbnail={token.thumbnail}
        type='stvEmoteLink'
        url={token.content}
      />
    );
  }

  return (
    <MediaLinkCard
      thumbnail={token.thumbnail}
      type='twitchClip'
      url={token.content}
    />
  );
}

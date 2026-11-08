import { MediaLinkCard } from '@app/components/chat/components/media-link-card/MediaLinkCard';
import type {
  MediaLinkTokenKind,
  MessageToken,
} from '@app/types/chat/messageToken';

interface MediaLinkTokenProps {
  token: MessageToken<MediaLinkTokenKind>;
}

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

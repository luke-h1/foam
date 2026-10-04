import type { TwitchClip } from '@app/types/twitch/clip';
import type { TwitchVideo } from '@app/types/twitch/video';

export type FullscreenChatMode = 'sidebar' | 'overlay';

export type ProfileTab = 'vods' | 'clips';

export type ProfileListItem =
  | { kind: 'clip'; clip: TwitchClip }
  | { kind: 'vod'; vod: TwitchVideo };

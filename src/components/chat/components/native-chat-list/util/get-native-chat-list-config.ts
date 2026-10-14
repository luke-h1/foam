import type { NativeChatListConfig } from '@modules/native-chat-list/src/NativeChatList.types';

const ANIMATED_CONFIG: NativeChatListConfig = { animateEmotes: true };
const STATIC_CONFIG: NativeChatListConfig = { animateEmotes: false };

/**
 * List-wide settings. Sizes and colours travel on each row, so this only
 * changes when the animation preference does.
 */
export function getNativeChatListConfig(
  animateEmotes: boolean,
): NativeChatListConfig {
  return animateEmotes ? ANIMATED_CONFIG : STATIC_CONFIG;
}

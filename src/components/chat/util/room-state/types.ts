import type { ParsedRoomState } from '@app/store/chat/types/room-state';
import type { NoticeMsgId } from '@app/types/chat/irc-tags/notice';

interface RoomStateModeStatus {
  active: boolean;
  /**
   * Slow-mode seconds or followers-only minutes; undefined for plain on/off
   * modes and for followers-only with no minimum follow age.
   */
  value?: number;
}

export interface RoomStateModeDefinition {
  getStatus: (state: ParsedRoomState) => RoomStateModeStatus;
  activeSummary: (value: number | undefined) => string;
  enabledNotice: (value: number | undefined) => string;
  disabledNotice: string;
  /**
   * Twitch NOTICE msg-ids that repeat this mode change. The ROOMSTATE notice
   * already covers them, so chat suppresses them.
   */
  noticeIds: readonly NoticeMsgId[];
}

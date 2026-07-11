import type { ParsedRoomState } from '@app/store/chat/types/roomState';

export interface RoomStateModeStatus {
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
}

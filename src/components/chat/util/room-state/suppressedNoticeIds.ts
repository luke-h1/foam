import { MODE_KEYS } from '@app/components/chat/util/room-state/modeKeys';
import { ROOM_STATE_MODES } from '@app/components/chat/util/room-state/roomStateModes';

export const SUPPRESSED_NOTICE_IDS = new Set([
  ...MODE_KEYS.flatMap(key => ROOM_STATE_MODES[key].noticeIds),
  'delete_message_success',
]);

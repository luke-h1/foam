import { createHitslop } from '@app/utils/string/create-hit-slop';

import { CHAT_SURFACE_COLORS } from './util/chat-scale';

export const CHAT_PRESS_HIT_SLOP = createHitslop(8);

export const chatPressedStyle = {
  backgroundColor: CHAT_SURFACE_COLORS.pressed,
  borderRadius: CHAT_SURFACE_COLORS.radius,
  borderCurve: 'continuous',
} as const;

import { createScrollActivity } from '@app/components/chat/util/create-scroll-activity';

/**
 * Separate from chatScrollActivity so scrolling the grid never pauses the
 * chat emotes still visible above the sheet.
 */
export const emoteSheetScrollActivity = createScrollActivity();

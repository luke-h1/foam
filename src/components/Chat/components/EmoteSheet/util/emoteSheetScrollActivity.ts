import { createScrollActivity } from '@app/components/Chat/util/createScrollActivity';

/**
 * Separate from chatScrollActivity so scrolling the grid never pauses the
 * chat emotes still visible above the sheet.
 */
export const emoteSheetScrollActivity = createScrollActivity();

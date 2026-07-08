import { createScrollActivity } from '@app/components/Chat/util/createScrollActivity';

/**
 * A scroll signal the emote sheet grid pokes on every scroll tick. Kept separate
 * from chatScrollActivity so scrolling the grid never pauses the chat emotes
 * still visible above the sheet.
 */
export const emoteSheetScrollActivity = createScrollActivity();

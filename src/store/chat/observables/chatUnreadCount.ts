import { observable } from '@legendapp/state';

/**
 * Messages committed while scrolled away from the bottom; read only by the
 * unread jump pill, so a flush re-renders that pill and nothing else.
 */
export const chatUnreadCount$ = observable(0);

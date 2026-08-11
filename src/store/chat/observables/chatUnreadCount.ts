import { observable } from '@legendapp/state';

/**
 * Messages committed while the user is scrolled away from the bottom.
 * Session-scoped and never persisted; written by the ingest controller via
 * `store/chat/actions/chatUnread` and read only by the unread jump pill, so
 * a flush while scrolled up re-renders that pill and nothing else.
 */
export const chatUnreadCount$ = observable(0);

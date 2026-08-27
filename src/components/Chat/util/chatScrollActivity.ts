import { createScrollActivity } from './createScrollActivity';

/**
 * A single global signal the chat list pokes on every scroll tick, so animated
 * emotes can stop decoding during a fling and resume after a quiet window.
 */
export const chatScrollActivity = createScrollActivity();

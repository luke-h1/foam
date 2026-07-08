import { createScrollActivity } from './createScrollActivity';

/**
 * A single global signal the chat list pokes on every scroll tick. It marks the
 * list as actively scrolling and auto-settles after a short quiet window, so
 * animated emotes can stop decoding during a fling (the most CPU-contended
 * moment) and resume once it stops.
 */
export const chatScrollActivity = createScrollActivity();

/**
 * Master switch for iOS picture-in-picture on the live player. Disabled while
 * the internal build 108 hard crash is investigated; flipping this back on
 * restores the overlay button, the WKWebView PiP entitlement, and the embed's
 * PiP bridge script. Re-add `UIBackgroundModes: ['audio']` in app.config.ts
 * when re-enabling, or PiP pauses as soon as the app backgrounds.
 */
export const PIP_ENABLED = false;

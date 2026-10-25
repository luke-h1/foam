/**
 * The web app has no WebView engine to warm; the native variant preconnects
 * WebKit to Twitch's player hosts at boot.
 */
export function PlayerWebViewPrewarm() {
  return null;
}

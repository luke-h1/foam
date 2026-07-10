import type { PaintData } from '@app/types/seventv/cosmetics';

import {
  buildPaintCssDeclarations,
  paintCssDeclarationsToBlock,
} from './paintCss';

export interface PaintedUsernameHtmlOptions {
  displayUsername: string;
  paint: PaintData;
  fallbackColor: string;
  fontSize: number;
  lineHeight: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Standalone document reproducing the extension's painted span: the per-paint
 * rule from `buildPaintCssDeclarations` on top of the
 * `.seventv-painted-content` base class (`background-color: currentcolor`
 * under the gradient stack, gradients clipped to glyphs via
 * `background-clip: text`, forced weight 700).
 *
 * `font-family: Montserrat` resolves on iOS because the app's expo-font
 * config plugin registers the family with the OS and WKWebView sees
 * OS-registered fonts; the Android system WebView cannot see app fonts and
 * falls back to sans-serif. A production rasterizer would embed the face as
 * a base64 `@font-face` instead.
 *
 * The measurement script reports the span's rect so the host view can size
 * itself; the drop-shadow filter paints outside that rect, matching how the
 * extension lets shadows overflow the username's layout box.
 */
export function buildPaintedUsernameHtml({
  displayUsername,
  paint,
  fallbackColor,
  fontSize,
  lineHeight,
}: PaintedUsernameHtmlOptions): string {
  const paintCss = paintCssDeclarationsToBlock(
    buildPaintCssDeclarations(paint),
  );

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  /* The paint rule's "color: inherit" must resolve to the username's
     fallback color, exactly as the extension's span inherits it. */
  color: ${fallbackColor};
}
.painted {
  display: inline-block;
  white-space: nowrap;
  font-family: Montserrat, -apple-system, sans-serif;
  font-size: ${fontSize}px;
  line-height: ${lineHeight}px;
  font-weight: 700;
  background-color: currentcolor;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text !important;
  background-clip: text !important;
}
.painted {
${paintCss}
}
</style>
</head>
<body>
<span id="painted" class="painted">${escapeHtml(displayUsername)}</span>
<script>
  var rect = document.getElementById('painted').getBoundingClientRect();
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ width: rect.width, height: rect.height })
  );
</script>
</body>
</html>`;
}

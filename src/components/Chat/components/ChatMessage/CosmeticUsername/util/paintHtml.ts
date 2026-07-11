import type { PaintData } from '@app/types/seventv/cosmetics';

import { buildPaintCssDeclarations } from './paintCss/buildPaintCssDeclarations';
import { paintCssDeclarationsToBlock } from './paintCss/paintCssDeclarationsToBlock';

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
  /* The paint rule's "color: inherit" / "font-weight: inherit" must resolve to
     the username's fallback colour and chat's bold weight, exactly as the
     extension's span inherits them from the chat message context. */
  color: ${fallbackColor};
  font-weight: 700;
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

/**
 * Camel-cased CSS declarations for one paint, mirroring the rule the 7TV
 * extension writes per paint in `updatePaintStyle` (Extension
 * src/composable/useCosmetics.ts) plus the `.seventv-painted-content` base
 * class from its global stylesheet. Values follow the extension's fallbacks
 * (`inherit` / `unset`) so a WebView given these declarations renders the
 * same computed style as the extension's painted span.
 */
export interface PaintCssDeclarations {
  color: string;
  backgroundImage: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundRepeat: string;
  filter: string;
  fontWeight: string;
  webkitTextStrokeWidth: string;
  webkitTextStrokeColor: string;
  textShadow: string;
  textTransform: string;
}

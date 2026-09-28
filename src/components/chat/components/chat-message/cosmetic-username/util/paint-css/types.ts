/**
 * Camel-cased CSS declarations for one paint, mirroring the 7TV extension's
 * per-paint rule so a WebView renders the same computed style.
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

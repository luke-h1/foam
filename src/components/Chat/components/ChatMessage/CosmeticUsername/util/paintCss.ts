import { getPaintLayers } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintLayer';
import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintLayerData,
  PaintStop,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

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

type CssLayer = {
  image: string;
  position: string;
  size: string;
  repeat: string;
};

function sortedLayerStops(layer: PaintLayerData): PaintStop[] {
  return indexedCollectionToArray<PaintStop>(layer.stops)
    .slice()
    .sort((a, b) => a.at - b.at);
}

/**
 * WKWebView's WebP image reader fails to decode some animated 7TV paint
 * textures (`makeImagePlus ... 'WEBP'-_reader->initImage failed err=-50`),
 * leaving the layer blank and logging the error. Its AVIF reader decodes the
 * same source and 7TV serves an `.avif` sibling at the same path, so hand the
 * WebView AVIF. Chromium (the extension's own engine, and any headless-Chrome
 * oracle) decodes both, so the render stays faithful. Only rewrites 7TV CDN
 * paint-layer URLs; every other URL is returned untouched.
 */
export function webKitSafeLayerImageUrl(url: string): string {
  return url.replace(
    /^(https:\/\/cdn\.7tv\.app\/paint\/[^?\s]+)\.webp(\?\S*)?$/,
    '$1.avif$2',
  );
}

function cssStopList(stops: PaintStop[]): string {
  return stops
    .map(stop => `${sevenTvColorToCss(stop.color)} ${stop.at * 100}%`)
    .join(', ');
}

function cssLayer(layer: PaintLayerData): CssLayer {
  let image: string;
  switch (layer.function) {
    case 'LINEAR_GRADIENT':
      image = `${layer.repeat ? 'repeating-' : ''}linear-gradient(${layer.angle ?? 0}deg, ${cssStopList(sortedLayerStops(layer))})`;
      break;
    case 'RADIAL_GRADIENT':
      image = `${layer.repeat ? 'repeating-' : ''}radial-gradient(${layer.shape ?? 'circle'}, ${cssStopList(sortedLayerStops(layer))})`;
      break;
    case 'URL':
      image = `url(${webKitSafeLayerImageUrl(layer.image_url)})`;
      break;
  }

  return {
    image,
    /**
     * extension emits empty strings when a layer has no explicit
     * position/size; in a standalone document that would invalidate the whole
     * comma-separated list, so emit the CSS initial values instead.
     */
    position: layer.at
      ? `${layer.at[0] * 100}% ${layer.at[1] * 100}%`
      : '0% 0%',
    size: layer.size
      ? `${layer.size[0] * 100}% ${layer.size[1] * 100}%`
      : 'auto',
    repeat: layer.canvas_repeat || 'unset',
  };
}

export function buildPaintCssDeclarations(
  paint: PaintData,
): PaintCssDeclarations {
  const layers = getPaintLayers(paint).map(cssLayer);
  const shadows = indexedCollectionToArray(paint.shadows);
  const textStyle = paint.textStyle;
  const textShadows = textStyle?.shadows
    ? indexedCollectionToArray(textStyle.shadows)
    : [];

  return {
    color: paint.color === null ? 'inherit' : sevenTvColorToCss(paint.color),
    backgroundImage: layers.map(layer => layer.image).join(', ') || 'none',
    backgroundPosition:
      layers.map(layer => layer.position).join(', ') || '0% 0%',
    backgroundSize: layers.map(layer => layer.size).join(', ') || 'auto',
    backgroundRepeat: layers.map(layer => layer.repeat).join(', ') || 'unset',
    filter:
      shadows
        .map(
          shadow =>
            `drop-shadow(${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${sevenTvColorToCss(shadow.color)})`,
        )
        .join(' ') || 'inherit',
    fontWeight: textStyle?.weight ? String(textStyle.weight * 100) : 'inherit',
    webkitTextStrokeWidth: textStyle?.stroke
      ? `${textStyle.stroke.width}px`
      : 'inherit',
    webkitTextStrokeColor: textStyle?.stroke
      ? sevenTvColorToCss(textStyle.stroke.color)
      : 'inherit',
    textShadow:
      textShadows
        .map(
          shadow =>
            `${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${sevenTvColorToCss(shadow.color)}`,
        )
        .join(', ') || 'unset',
    textTransform: textStyle?.transform ?? 'unset',
  };
}

export function paintCssDeclarationsToBlock(
  declarations: PaintCssDeclarations,
): string {
  return [
    `color: ${declarations.color};`,
    `background-image: ${declarations.backgroundImage};`,
    `background-position: ${declarations.backgroundPosition};`,
    `background-size: ${declarations.backgroundSize};`,
    `background-repeat: ${declarations.backgroundRepeat};`,
    `filter: ${declarations.filter};`,
    `font-weight: ${declarations.fontWeight};`,
    `-webkit-text-stroke-width: ${declarations.webkitTextStrokeWidth};`,
    `-webkit-text-stroke-color: ${declarations.webkitTextStrokeColor};`,
    `text-shadow: ${declarations.textShadow};`,
    `text-transform: ${declarations.textTransform};`,
  ].join('\n');
}

import type { PaintCssDeclarations } from './types';

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

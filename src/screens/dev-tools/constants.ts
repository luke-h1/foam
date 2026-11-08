import type { SevenTvPaintRenderer } from '@app/store/preference-store';

export const PAINT_RENDERER_HELP =
  'Skia keeps the paint up while chat scrolls. Native swaps to a solid colour during a fling. Off uses the chat colour. WebView checks the CSS.';

export const PAINT_RENDERER_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: 'Native', value: 'native' },
  { label: 'Skia', value: 'skia' },
  { label: 'WebView', value: 'webview' },
] as const satisfies readonly {
  label: string;
  value: SevenTvPaintRenderer;
}[];

import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';

import RenderHTML, { type CustomTextualRenderer } from '@native-html/render';

import type { PaintData } from '@app/types/seventv/cosmetics';

import { PaintedUsernameNativeLayers } from './PaintedUsernameNativeLayers';
import {
  type PaintedUsernameRenderContextValue,
  PaintedUsernameRenderProvider,
} from './PaintedUsernameRenderContext';
import {
  buildPaintCssInlineStyle,
  buildPaintCssTextStyle,
} from './util/buildPaintCssStyle';
import type { PaintDropShadowMode } from './util/paintLayer';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const PaintedSpanRenderer: CustomTextualRenderer = ({
  TDefaultRenderer,
  tnode,
  ...props
}) => {
  if (tnode.attributes['data-seventv-painted-text'] !== 'true') {
    return <TDefaultRenderer tnode={tnode} {...props} />;
  }

  return <PaintedUsernameNativeLayers />;
};

interface PaintedUsernameHtmlProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  renderContext: PaintedUsernameRenderContextValue;
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameMetricsStyle: PaintedUsernameRenderContextValue['usernameTextStyle'];
}

/**
 * Renders a 7TV paint via @native-html/render using extension-style CSS.
 *
 * Web applies `background-clip: text`, `filter: drop-shadow()`, and
 * `-webkit-text-stroke` from {@link buildPaintCssTextStyle}. Native falls back
 * to layered MaskedView rendering because those CSS properties are not
 * supported by the native HTML engine on iOS and Android.
 */
export function PaintedUsernameHtml({
  displayUsername,
  fallbackColor,
  paint,
  renderContext,
  sevenTvPaintDropShadows,
  usernameMetricsStyle,
}: PaintedUsernameHtmlProps) {
  const { width } = useWindowDimensions();
  const inlineCss = buildPaintCssInlineStyle(
    paint,
    fallbackColor,
    sevenTvPaintDropShadows,
  );

  const source = useMemo(
    () => ({
      html: `<span class="seventv-painted-content seventv-paint" data-seventv-paint-id="${paint.id}" data-seventv-painted-text="true" style="${inlineCss}">${escapeHtml(displayUsername)}</span>`,
    }),
    [displayUsername, inlineCss, paint.id],
  );

  const flatMetrics = StyleSheet.flatten(usernameMetricsStyle) ?? {};

  const tagsStyles = useMemo(
    () =>
      Platform.OS === 'web'
        ? {
            span: {
              ...flatMetrics,
              ...buildPaintCssTextStyle(
                paint,
                fallbackColor,
                sevenTvPaintDropShadows,
              ),
            },
          }
        : {
            span: flatMetrics,
          },
    [fallbackColor, flatMetrics, paint, sevenTvPaintDropShadows],
  );

  const renderers = useMemo(
    () =>
      Platform.OS === 'web'
        ? undefined
        : {
            span: PaintedSpanRenderer,
          },
    [],
  );

  return (
    <PaintedUsernameRenderProvider value={renderContext}>
      <RenderHTML
        contentWidth={width}
        defaultTextProps={{ allowFontScaling: false }}
        renderers={renderers}
        source={source}
        tagsStyles={tagsStyles}
      />
    </PaintedUsernameRenderProvider>
  );
}

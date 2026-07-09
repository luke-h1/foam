import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import RenderHTML, {
  type CustomTextualRenderer,
  type MixedStyleDeclaration,
} from '@native-html/render';

import type { PaintData } from '@app/types/seventv/cosmetics';

import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameNativeLayers } from './PaintedUsernameNativeLayers';
import { PaintedUsernameRenderProvider } from './PaintedUsernameRenderContext';
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
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
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
  sevenTvPaintDropShadows,
  usernameTextStyle,
}: PaintedUsernameHtmlProps) {
  const { width } = useWindowDimensions();
  const renderContext = useMemo(
    () => ({
      displayUsername,
      fallbackColor,
      paint,
      sevenTvPaintDropShadows,
      usernameTextStyle,
    }),
    [
      displayUsername,
      fallbackColor,
      paint,
      sevenTvPaintDropShadows,
      usernameTextStyle,
    ],
  );
  const usernameMetricsStyle = useMemo(
    () => [styles.maskText, usernameTextStyle] as StyleProp<TextStyle>,
    [usernameTextStyle],
  );
  const inlineCss = buildPaintCssInlineStyle(
    paint,
    fallbackColor,
    sevenTvPaintDropShadows,
  );

  const source = useMemo(
    () => ({
      html: `<span class="seventv-painted-content seventv-paint" data-seventv-paint-id="${escapeHtml(paint.id)}" data-seventv-painted-text="true" style="${inlineCss}">${escapeHtml(displayUsername)}</span>`,
    }),
    [displayUsername, inlineCss, paint.id],
  );

  const tagsStyles = useMemo((): Record<string, MixedStyleDeclaration> => {
    const { overflow: _overflow, ...flatMetrics } =
      StyleSheet.flatten(usernameMetricsStyle) ?? {};

    if (Platform.OS === 'web') {
      return {
        span: {
          ...flatMetrics,
          ...buildPaintCssTextStyle(
            paint,
            fallbackColor,
            sevenTvPaintDropShadows,
          ),
        } as MixedStyleDeclaration,
      };
    }

    return {
      span: flatMetrics as MixedStyleDeclaration,
    };
  }, [fallbackColor, paint, sevenTvPaintDropShadows, usernameMetricsStyle]);

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

const styles = StyleSheet.create({
  maskText: {
    ...chatLineMetrics.comfortable,
    color: 'black',
    fontWeight: 'bold',
  },
});

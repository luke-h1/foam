import React from 'react';
import { Text } from 'react-native';

function RenderHTML({
  renderers,
  source,
}: {
  renderers?: Record<
    string,
    React.ComponentType<{
      tnode: { attributes: Record<string, string> };
    }>
  >;
  source: { html: string };
}) {
  if (
    renderers?.span &&
    source.html.includes('data-seventv-painted-text="true"')
  ) {
    const SpanRenderer = renderers.span;
    return React.createElement(SpanRenderer, {
      tnode: { attributes: { 'data-seventv-painted-text': 'true' } },
    });
  }

  const text = source.html.replaceAll(/<[^>]+>/g, '');
  return React.createElement(Text, null, text);
}

export default RenderHTML;

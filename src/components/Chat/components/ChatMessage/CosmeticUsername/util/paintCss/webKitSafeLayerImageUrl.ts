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

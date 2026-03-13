import type { WebViewMessageEvent } from 'react-native-webview';

const SCRIPT_URL = 'https://embed.twitch.tv/embed/v1.js';

type WarmupRenderProps = {
  key: string;
  onLoadEnd: () => void;
  onMessage: (event: WebViewMessageEvent) => void;
  source: { baseUrl: string; html: string };
};

class WebViewWarmupPool {
  private warmedParents = new Set<string>();

  private warmingParents = new Set<string>();

  // eslint-disable-next-line class-methods-use-this
  private normalizeParent(parent: string): string {
    const value = parent.trim().toLowerCase();
    return value.length > 0 ? value : 'www.twitch.tv';
  }

  // eslint-disable-next-line class-methods-use-this
  private buildWarmupHtml(parent: string): string {
    const safeParent = parent.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="dns-prefetch" href="//embed.twitch.tv">
  <link rel="preconnect" href="https://embed.twitch.tv" crossorigin>
  <link rel="preconnect" href="https://static.twitchcdn.net" crossorigin>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  </style>
</head>
<body>
  <script>
    (function() {
      function post(type, payload) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
        } catch (e) {}
      }
      post('trace', { step: 'warmup_start', detail: 'parent=${safeParent}' });
      if (window._twitchEmbedLoaded) {
        post('warmupReady', { parent: '${safeParent}', cached: true });
        return;
      }
      var script = document.createElement('script');
      script.src = '${SCRIPT_URL}';
      script.async = true;
      script.onload = function() {
        window._twitchEmbedLoaded = true;
        post('warmupReady', { parent: '${safeParent}', cached: false });
      };
      script.onerror = function() {
        post('warmupError', { parent: '${safeParent}' });
      };
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>`;
  }

  startWarmup(parent: string) {
    const normalizedParent = this.normalizeParent(parent);
    if (
      this.warmedParents.has(normalizedParent) ||
      this.warmingParents.has(normalizedParent)
    ) {
      return;
    }
    this.warmingParents.add(normalizedParent);
  }

  getWarmupRenderProps(parent: string): WarmupRenderProps | null {
    const normalizedParent = this.normalizeParent(parent);
    if (this.warmedParents.has(normalizedParent)) {
      return null;
    }

    this.startWarmup(normalizedParent);

    return {
      key: `stream-prewarm-${normalizedParent}`,
      source: {
        html: this.buildWarmupHtml(normalizedParent),
        baseUrl: `https://${normalizedParent}/`,
      },
      onMessage: (event: WebViewMessageEvent) => {
        try {
          const payload = JSON.parse(event.nativeEvent.data) as {
            payload?: { parent?: string };
            type?: string;
          };
          const messageParent = this.normalizeParent(
            payload.payload?.parent ?? normalizedParent,
          );
          if (payload.type === 'warmupReady') {
            this.warmingParents.delete(messageParent);
            this.warmedParents.add(messageParent);
          }
        } catch {
          /* empty */
        }
      },
      onLoadEnd: () => {
        this.warmingParents.delete(normalizedParent);
        this.warmedParents.add(normalizedParent);
      },
    };
  }
}

export const streamWebViewWarmupPool = new WebViewWarmupPool();

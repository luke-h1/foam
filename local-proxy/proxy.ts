const DEFAULT_STREAM_CHANNEL = 'forsen';
const TWITCH_CHANNEL_PATTERN = /^[a-zA-Z0-9_]{1,25}$/;
const TWITCH_VIDEO_PATTERN = /^\d+$/;
const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST;

declare const Bun: {
  serve(options: {
    port: number;
    hostname?: string;
    fetch(request: Request): Response | Promise<Response>;
  }): unknown;
};

const html = (body: string, init?: ResponseInit) =>
  new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...init?.headers,
    },
  });

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init?.headers,
    },
  });

const notFound = () => new Response('Not found', { status: 404 });

const renderRedirectPage = ({
  targetPrefix,
  title,
}: {
  targetPrefix: string;
  title: string;
}) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
    />
    <title>${title}</title>
  </head>
  <body>
    <h1>Redirecting...</h1>
    <script>
      const search = window.location.search.replace(/^\\?/, '');
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash);

      for (const [key, value] of hashParams.entries()) {
        params.set(key, value);
      }

      const query = params.toString();
      window.location.replace(query ? '${targetPrefix}?' + query : '${targetPrefix}');
    </script>
  </body>
</html>
`;

const renderStreamPage = (request: Request, url: URL) => {
  const requestedChannel = url.searchParams.get('channel') ?? undefined;
  const channel =
    requestedChannel && TWITCH_CHANNEL_PATTERN.test(requestedChannel)
      ? requestedChannel
      : DEFAULT_STREAM_CHANNEL;
  const requestedVideo = url.searchParams.get('video') ?? undefined;
  const video =
    requestedVideo && TWITCH_VIDEO_PATTERN.test(requestedVideo)
      ? requestedVideo
      : undefined;
  const host = request.headers.get('host') || 'localhost';
  const parent = host.split(':')[0] ?? 'localhost';
  const safeChannel = encodeURIComponent(channel);
  const iframeSrc = video
    ? `https://player.twitch.tv/?video=${encodeURIComponent(
        video,
      )}&parent=${encodeURIComponent(parent)}&muted=false`
    : `https://player.twitch.tv/?channel=${safeChannel}&parent=${encodeURIComponent(
        parent,
      )}&muted=false&low_latency=true`;

  return html(`
	<!DOCTYPE html>
	<html lang="en">
	<head>
	    <meta charset="UTF-8">
	    <title>Twitch Stream</title>
	    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #0e0e10;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .player-wrap {
            position: relative;
            width: 100%;
            height: 100%;
        }
        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .tap-hint {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: rgba(0,0,0,0.75);
            color: rgba(255,255,255,0.8);
            font-size: 13px;
            border-radius: 8px;
            pointer-events: none;
            opacity: 0;
            animation: fadeInOut 6s ease-in-out;
        }
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="player-wrap">
        <iframe
            id="twitch-embed"
            src="${iframeSrc}"
            allowfullscreen="true"
            allow="autoplay; encrypted-media; fullscreen"
            scrolling="no">
        </iframe>
        <div class="tap-hint">Tap the video to log in if prompted</div>
    </div>
</body>
</html>
    `);
};

const getDefaultToken = async () => {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID ?? '',
      client_secret: process.env.TWITCH_CLIENT_SECRET ?? '',
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return json(data, { status: response.status });
  }

  console.info('serving Twitch default token');
  return json(data);
};

const renderPendingPage = (url: URL) => {
  const redirectUrl = `foam://?${url.searchParams.toString()}`;

  return html(`
      <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body>
          <h1>Redirecting...</h1>
          <script>
            setTimeout(() => {
              window.location.href = ${JSON.stringify(redirectUrl)};
            }, 1000);
          </script>
        </body>
      </html>
    `);
};

const handleRequest = async (request: Request) => {
  if (request.method !== 'GET') {
    return notFound();
  }

  const url = new URL(request.url);

  switch (url.pathname) {
    case '/api/proxy-expo-go':
      return html(
        renderRedirectPage({
          targetPrefix: 'exp://localhost:8081/--/',
          title: 'Redirecting to Expo Go',
        }),
      );
    case '/api/proxy':
      return html(
        renderRedirectPage({
          targetPrefix: 'foam://',
          title: 'Redirecting to Foam',
        }),
      );
    case '/api/proxy/default-token':
      return getDefaultToken();
    case '/api/stream':
      return renderStreamPage(request, url);
    case '/api/pending':
      return renderPendingPage(url);
    default:
      return notFound();
  }
};

Bun.serve({
  port: PORT,
  ...(HOST ? { hostname: HOST } : {}),
  fetch: async request => {
    try {
      return await handleRequest(request);
    } catch (error) {
      console.error(error);
      return new Response('Internal server error', { status: 500 });
    }
  },
});

console.info(
  HOST
    ? `Auth proxy server started on ${HOST}:${PORT}`
    : `Auth proxy server started on port: ${PORT}`,
);

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */

import axios from 'axios';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

dotenv.config();

const main = async () => {
  const app = express();

  app.get('/api/proxy-expo-go', async (req: Request, res: Response) => {
    // This is fragile and won't work in many cases. It's just an example. Physical devices, and android emulators will need the full IP address instead of localhost.
    // This also assumes the dev server is running on port 8081.
    const redirectUri = `exp://localhost:8081/--/?${new URL(req.url, 'http://a').searchParams}`;

    console.log(`Redirect to expo-go app -> ${redirectUri}`);

    return res.status(302).redirect(redirectUri);
  });

  app.get('/api/proxy', async (req: Request, res: Response) => {
    const redirectUri = `foam://?${new URL(req.url, 'http://a').searchParams}`;

    console.info(`redirecting to app with redirect_uri -> ${redirectUri}`);

    return res.status(302).redirect(redirectUri);
  });

  app.get(
    '/api/proxy/default-token',
    // @ts-expect-error express type issue
    async (req: Request, res: Response) => {
      const { data } = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials',
          },
          headers: {
            'Content-Type': 'x-www-form-urlencoded',
          },
        },
      );

      console.info('serving token ->', JSON.stringify(data, null, 2));
      return res.status(200).json(data);
    },
  );

  app.get('/api/stream', (req: Request, res: Response) => {
    const channel = (req.query.channel as string) || 'forsen';
    const video = req.query.video as string | undefined;
    const host = req.get('host') || 'localhost';
    const parent = host.split(':')[0] ?? 'localhost';
    const safeChannel = encodeURIComponent(channel);
    const iframeSrc = video
      ? `https://player.twitch.tv/?video=${encodeURIComponent(video)}&parent=${encodeURIComponent(parent)}&muted=false`
      : `https://player.twitch.tv/?channel=${safeChannel}&parent=${encodeURIComponent(parent)}&muted=false&low_latency=true`;

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${channel} - Twitch Stream</title>
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
  });

  // @ts-expect-error - express type definitions are incorrect
  app.get('/api/pending', async (req: Request, res: Response) => {
    return res.status(200).send(`
      <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body>
          <h1>Redirecting...</h1>
          <script>
            setTimeout(() => {
              window.location.href = 'foam://?${new URL(req.url, 'http://foam/').searchParams}';
            }, 1000);
          </script>
        </body>
        </html>
      `);
  });

  const PORT = 4000;

  app.listen(PORT, () => {
    console.info(`Auth proxy server started on port: ${PORT}`);
  });
};

main();

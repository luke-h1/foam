/* eslint-disable no-console */
import axios from 'axios';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

dotenv.config();

/**
 * API (only for local environments) used for proxying various requests to and from twitch that require a CLIENT_SECRET
 * to be passed to the Twitch API. In production, we use https://github.com/luke-h1/foam-proxy
 * to accomplish this
 */

// function thirdPartyBadgesAndEmotesRoutes(app: Application) {
//   app.get(
//     '/api/emotes/twitch/global',
//     async (req: Request, res: Response) => {},
//   );

//   app.get(
//     '/api/emotes/twitch/channel/:channelId',
//     async (req: Request, res: Response) => {},
//   );
// }

const main = async () => {
  const app = express();

  app.on('request', () => {
    console.info('received req');
  });
  app.get('/', (req: Request, res: Response) => {
    res.send('proxy running');
  });

  // @ts-expect-error express type mismatch
  app.get('/api/healthcheck', (req: Request, res: Response) => {
    const {
      EXPO_PUBLIC_TWITCH_CLIENT_ID,
      EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
      EXPO_PUBLIC_PROXY_API_BASE_URL,
    } = process.env;

    if (
      !EXPO_PUBLIC_PROXY_API_BASE_URL ||
      !EXPO_PUBLIC_TWITCH_CLIENT_SECRET ||
      !EXPO_PUBLIC_TWITCH_CLIENT_ID
    ) {
      return res.status(500).json({
        message: 'One or more environment variables are missing',
      });
    }

    return res.status(200).json({
      message: 'Healthy, found environment variables.',
    });
  });

  app.get('/api/proxy', async (req: Request, res: Response) => {
    const redirectUri = `foam://?${new URL(req.url, 'http://foam').searchParams}`;

    console.info('redirecting to app:', redirectUri);

    return res.status(302).redirect(redirectUri);
  });

  // @ts-expect-error express type issue
  app.get('/api/proxy/default-token', async (req: Request, res: Response) => {
    const isExpoGo = req.query.isExpoGo === 'true';
    console.log('req.query', req.query);

    if (isExpoGo) {
      /* 
       This is fragile and won't work in many cases. It's just an example. Physical devices, and android emulators will need the full IP address instead of localhost.
       This also assumes the dev server is running on port 8081.
      */
      const redirectUri = `exp://localhost:8081/--/?${new URL(req.url, 'http://foam').searchParams}`;

      console.info('redirecting to app:', redirectUri);
      return res.status(302).redirect(redirectUri);
    }

    console.info('request for default token...');

    const { data } = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
          client_secret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials',
        },
        headers: {
          'Content-Type': 'x-www-form-urlencoded',
        },
      },
    );

    console.info('serving token ->', data);
    return res.status(200).json(data);
  });

  // @ts-expect-error - express type definitions are incorrect
  app.get('/api/pending', async (req: Request, res: Response) => {
    // return res.status(200).
    // send html
    return res.status(200).send(`
      <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body>
          <h1>Redirecting...</h1>
          <script>
            setTimeout(() => {
              window.location.href = 'foam://?${new URL(req.url, 'http://foam').searchParams}';
            }, 1000);
          </script>
        </body>
      `);
  }); // thirdPartyBadgesAndEmotesRoutes(app);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.info(`Proxy server started on port: ${PORT}`);
  });
};

main();

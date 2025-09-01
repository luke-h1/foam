/* eslint-disable no-console */
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
    // const redirectUri = `${APP_SCHEME_NAME}://?${new URL(req.url, `foam://`).searchParams}`;
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
            client_id: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
            client_secret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
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

  // @ts-expect-error - express type definitions are incorrect
  app.get('/api/pending', (req: Request, res: Response) => {
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

/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');

// eslint-disable-next-line import/no-named-as-default-member
dotenv.config();

const main = async () => {
  const app = express();

  app.get('/', (req, res) => {
    res.send('proxy running');
  });

  app.get('/api/proxy', async (req, res) => {
    const redirectUri = `foam://?${new URL(req.url, 'http://foam').searchParams}`;

    console.info('redirecting to app:', redirectUri);

    return res.status(302).redirect(redirectUri);
  });

  app.get('/api/proxy/default-token', async (req, res) => {
    const isExpoGo = req.query.isExpoGo === 'true';
    console.log('req.query', req.query);

    if (isExpoGo) {
      console.log('request for default token from Expo Go');
      // This is fragile and won't work in many cases. It's just an example. Physical devices, and android emulators will need the full IP address instead of localhost.
      // This also assumes the dev server is running on port 8081.
      const redirectUri = `exp://localhost:8081/--/?${new URL(req.url, 'http://foam').searchParams}`;

      console.info('redirecting to app:', redirectUri);

      return res.status(302).redirect(redirectUri);
    }

    console.info('request for default token');
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

    console.log('default token', data);
    return res.status(200).json(data);
  });

  app.get('/api/pending', async (req, res) => {
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
  });

  const PORT = process.env.PORT || 6500;

  app.listen(PORT, () => {
    console.info(`⚡️ -> Proxy server listening on port ${PORT}`);
  });
};

main().catch(e => console.error(e));

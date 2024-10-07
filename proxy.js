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
    const redirectUri = `foam://?${new URL(req.url, 'http://a').searchParams}`;

    console.info('redirecting to', redirectUri);

    return res.status(302).redirect(redirectUri);
  });

  app.get('/api/default-token', async (req, res) => {
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

  const PORT = process.env.PORT || 6500;

  app.listen(PORT, () => {
    console.info(`⚡️ -> Proxy server listening on port ${PORT}`);
  });
};

main().catch(e => console.error(e));

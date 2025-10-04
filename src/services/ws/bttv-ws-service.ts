// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export const bttvWsService = {
  handleEvents: (channelId: string) => {
    const ws = new WebSocket('wss://sockets.betterttv.net/ws');

    ws.onopen = () => {
      console.info('🔴 -> BTTV ws opened');
    };

    ws.send(
      JSON.stringify({
        name: 'join_channel',
        data: {
          name: `twitch:${channelId}`,
        },
      }),
    );

    ws.onmessage = (event: MessageEvent) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const message = JSON.parse(event.data);

        const messageType = message.name;
        const { data } = message;

        let userName: string = '';

        if (data.channel) {
          userName = 'none';
        }

        let emoteData = {
          name: 'none',
          url: '4x.avif',
          flags: 0,
          site: '',
          action: 'other',
          user: '',
        };

        if (messageType === 'emote_create') {
          if (!data.emote) {
            return;
          }

          emoteData = {
            name: data.emote.code,
            url: `https://cdn.betterttv.net/emote/${data.emote.id}/3x`,
            flags: 0,
            user: userName,
            site: 'BTTV',
            action: 'add',
          };
        }

        if (messageType === 'emote_delete') {
          // find the emote in the store and remove
        }

        if (messageType === 'emote_update') {
          if (!data.emote) {
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          emoteData = {
            name: data.emote.code,
            url: `https://cdn.betterttv.net/emote/${data.id}/3x`,
            flags: 0,
            user: userName,
            site: 'BTTV',
            action: 'update',
          };
        }

        // return emoteData;

        // respond to state change in chat
      } catch (e) {
        console.error('error parsing bttv msg', e);
      }
    };

    ws.onerror = err => {
      console.error('bttv ws err:', err);
    };

    ws.onclose = () => {
      console.log('bttv ws closed');
    };
  },
} as const;

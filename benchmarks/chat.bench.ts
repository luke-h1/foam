import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { Bench } from 'tinybench';
import { parseBadges } from '../src/utils/chat/parseBadges';
import { sanitizeInput } from '../src/utils/chat/sanitizeInput';

const badgesTag =
  'moderator/1,subscriber/12,bits/1000,partner/1,vip/1,founder/0,glhf-pledge/1';

const chatMessage =
  'hey everyone <3 great stream today >( but the lag is real <3 PogChamp ' +
  'check out the new emotes <3 and remember to follow >( the channel <3';

const bench = withCodSpeed(new Bench());

bench
  .add('parseBadges - multiple badges', () => {
    parseBadges(badgesTag);
  })
  .add('parseBadges - empty', () => {
    parseBadges('');
  })
  .add('sanitizeInput - emote heavy message', () => {
    sanitizeInput(chatMessage);
  });

bench.run().then(() => {
  console.table(bench.table());
});

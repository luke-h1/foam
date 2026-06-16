import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { Bench } from 'tinybench';
import {
  formatViewCount,
  formatViewCountCompact,
} from '../src/utils/string/formatViewCount';
import { truncate } from '../src/utils/string/truncate';
import { percentageOf } from '../src/utils/number/percentageOf';

const longMessage =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const bench = withCodSpeed(new Bench());

bench
  .add('formatViewCount - small', () => {
    formatViewCount(942);
  })
  .add('formatViewCount - large', () => {
    formatViewCount(1_482_193);
  })
  .add('formatViewCountCompact - thousands', () => {
    formatViewCountCompact(94_512);
  })
  .add('formatViewCountCompact - millions', () => {
    formatViewCountCompact(3_482_193);
  })
  .add('truncate - long string', () => {
    truncate(longMessage, 40);
  })
  .add('percentageOf', () => {
    percentageOf(347, 1290);
  });

bench.run().then(() => {
  console.table(bench.table());
});

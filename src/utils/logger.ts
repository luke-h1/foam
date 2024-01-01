import pino from 'pino';

const logger = pino({
  name: 'foam',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
export default logger;

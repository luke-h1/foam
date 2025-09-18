import {
  logger as rnlogger,
  defLvlType,
  consoleTransport,
} from 'react-native-logs';

const loggingConfig = {
  main: {
    enabled: true,
    color: 'default',
  },
  api: {
    enabled: true,
    color: 'blueBright',
  },
  stv: {
    enabled: true,
    color: 'green',
  },
  bttv: {
    enabled: true,
    color: 'red',
  },
  ffz: {
    enabled: true,
    color: 'yellow',
  },
  twitch: {
    enabled: true,
    color: 'magenta',
  },
  chat: {
    enabled: true,
    color: 'magentaBright',
  },
  auth: {
    enabled: true,
    color: 'grey',
  },
  performance: {
    enabled: true,
    color: 'cyanBright',
  },
  cache: {
    enabled: true,
    color: 'green',
  },
  cachedPhotos: {
    enabled: true,
    color: 'green',
  },
} satisfies Record<
  string,
  {
    enabled: boolean;
    color:
      | 'default'
      | 'black'
      | 'red'
      | 'green'
      | 'yellow'
      | 'blue'
      | 'magenta'
      | 'cyan'
      | 'white'
      | 'grey'
      | 'redBright'
      | 'greenBright'
      | 'yellowBright'
      | 'blueBright'
      | 'magentaBright'
      | 'cyanBright'
      | 'whiteBright';
  }
>;

const baseLogger = rnlogger.createLogger({
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: 'cyanBright',
      info: 'blue',
      warn: 'yellowBright',
      error: 'redBright',
    },
    extensionColors: {
      ...Object.fromEntries(
        Object.entries(loggingConfig).map(([k, v]) => [k, v.color]),
      ),
    },
  },
  enabledExtensions: Object.entries(loggingConfig)
    .filter(([, s]) => s.enabled)
    .map(([k]) => k),
});

const loggers = Object.fromEntries(
  Object.entries(loggingConfig).map(([key]) => {
    const extendedLogger = baseLogger.extend(key);
    return [key, extendedLogger];
  }),
);

type LoggingMethods = Record<defLvlType, (...args: unknown[]) => void>;

export const logger = loggers as Record<
  keyof typeof loggingConfig,
  LoggingMethods
>;

// Export allowed prefixes
export type AllowedPrefix = keyof typeof loggingConfig;
export const allowedPrefixes = Object.keys(loggingConfig) as AllowedPrefix[];

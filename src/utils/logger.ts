import { sentryService } from '@app/services/sentry-service';
import {
  logger as rnlogger,
  defLvlType,
  consoleTransport,
} from 'react-native-logs';
import type { transportFunctionType } from 'react-native-logs';

type TransportProps = Parameters<
  transportFunctionType<Record<string, unknown>>
>[0];

const createSentryTransport =
  (): transportFunctionType<Record<string, unknown>> =>
  (props: TransportProps) => {
    if (!props?.level) {
      return;
    }

    const { msg, rawMsg, level, extension } = props;
    const category = extension ?? 'app';
    const rawArgs = Array.isArray(rawMsg) ? rawMsg : [rawMsg];
    const errorFromArgs = rawArgs.find(
      (arg): arg is Error => arg instanceof Error,
    );

    if (level.text === 'error') {
      sentryService.addBreadcrumb({
        category,
        message: msg,
        level: 'error',
      });
      if (errorFromArgs) {
        sentryService.captureException(errorFromArgs, {
          tags: { category },
          extra: { logMessage: msg },
        });
      } else {
        sentryService.captureMessage(msg, {
          level: 'error',
          tags: { category },
        });
      }
    } else if (level.text === 'warn') {
      sentryService.addBreadcrumb({
        category,
        message: msg,
        level: 'warning',
      });
    }
  };

const sentryTransport = createSentryTransport();

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
  filesystem: {
    enabled: true,
    color: 'black',
  },

  /**
   * Websocket connections
   */
  twitchWs: {
    enabled: true,
    color: 'green',
  },
  stvWs: {
    enabled: true,
    color: 'cyanBright',
  },
  remoteConfig: {
    enabled: true,
    color: 'blueBright',
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
  transport: [consoleTransport, sentryTransport],
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

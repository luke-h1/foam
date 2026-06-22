import type { transportFunctionType } from 'react-native-logs';
import { consoleTransport, logger as rnlogger } from 'react-native-logs';

import { forwardLogToBugsnag } from '@app/lib/bugsnag';
import type { LogMetadata } from '@app/lib/sentry';
import { forwardLogToSentry } from '@app/lib/sentry';
import { isRecord, sanitiseLogValue } from '@app/utils/log/sanitiseLogValue';

export type { LogMetadata } from '@app/lib/sentry';

type TransportProps = Parameters<
  transportFunctionType<Record<string, unknown>>
>[0];

function stringifyLogMessage(value: unknown): string {
  if (typeof value === 'string') {
    return `${sanitiseLogValue(value)} `;
  }

  if (typeof value === 'function') {
    return `[function ${value.name || 'anonymous'}()] `;
  }

  if (value instanceof Error) {
    return `${value.message} `;
  }

  try {
    return `${JSON.stringify(sanitiseLogValue(value))} `;
  } catch {
    return '[Unserializable log payload] ';
  }
}

const createGenericTransport =
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
      console.error(`[${category}]`, msg);
      if (errorFromArgs) {
        console.error(`[${category}]`, errorFromArgs);
      }
    } else if (level.text === 'warn') {
      console.warn(`[${category}]`, msg);
    }
  };

const genericTransport = createGenericTransport();

const createMonitoringTransport =
  (): transportFunctionType<Record<string, unknown>> =>
  (props: TransportProps) => {
    if (!props?.level) {
      return;
    }

    const { rawMsg, level, extension } = props;
    const levelText = level.text;
    if (levelText === 'debug') {
      return;
    }

    const rawArgs = Array.isArray(rawMsg) ? rawMsg : [rawMsg];
    const [firstArg, secondArg] = rawArgs;

    let metadata: LogMetadata | undefined;
    let error: unknown;
    if (secondArg instanceof Error) {
      error = secondArg;
    } else if (isRecord(secondArg)) {
      metadata = secondArg as LogMetadata;
      error = metadata.error;
    }

    if (levelText === 'info' && typeof metadata?.name !== 'string') {
      return;
    }

    if (firstArg instanceof Error) {
      error ??= firstArg;
    }
    const message =
      firstArg instanceof Error
        ? firstArg.message
        : typeof firstArg === 'string'
          ? firstArg
          : String(firstArg);

    const entry = {
      level:
        levelText === 'error'
          ? ('error' as const)
          : levelText === 'warn'
            ? ('warn' as const)
            : ('info' as const),
      category: extension ?? 'app',
      message,
      error,
      metadata,
    };

    forwardLogToSentry(entry);
    forwardLogToBugsnag(entry);
  };

const monitoringTransport = createMonitoringTransport();

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
    color: 'cyan',
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
  streamElements: {
    enabled: true,
    color: 'whiteBright',
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
    color: 'cyan',
  },
  cachedPhotos: {
    enabled: true,
    color: 'cyan',
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
    color: 'blueBright',
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
      | 'yellow'
      | 'blue'
      | 'magenta'
      | 'cyan'
      | 'white'
      | 'grey'
      | 'redBright'
      | 'yellowBright'
      | 'blueBright'
      | 'magentaBright'
      | 'cyanBright'
      | 'whiteBright';
  }
>;

interface LogMethod {
  (message: string, metadata: LogMetadata): void;
  (message: string, ...args: unknown[]): void;
}

interface ErrorLogMethod {
  (message: string | Error, metadata: LogMetadata): void;
  (message: string | Error, ...args: unknown[]): void;
}

interface LoggingMethods {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: ErrorLogMethod;
}

export type AllowedPrefix = keyof typeof loggingConfig;

const baseLogger = rnlogger.createLogger({
  // Release builds only emit warnings and errors; debug/info logging is dev-only
  // so production isn't spending CPU stringifying chat traffic.
  severity: __DEV__ ? 'debug' : 'warn',
  transport: __DEV__
    ? [consoleTransport, genericTransport, monitoringTransport]
    : [genericTransport, monitoringTransport],
  stringifyFunc: stringifyLogMessage,
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
  enabledExtensions: Object.entries(loggingConfig).flatMap(([k, s]) =>
    s.enabled ? [k] : [],
  ),
});

const createExtendedLogger = (prefix: AllowedPrefix): LoggingMethods => {
  const base = baseLogger.extend(prefix);
  return {
    debug: (message: string, ...args: unknown[]) =>
      base.debug(message, ...args),
    info: (message: string, ...args: unknown[]) => base.info(message, ...args),
    warn: (message: string, ...args: unknown[]) => base.warn(message, ...args),
    error: (message: string | Error, ...args: unknown[]) =>
      base.error(message, ...args),
  };
};

export const logger: Record<AllowedPrefix, LoggingMethods> = {
  main: createExtendedLogger('main'),
  api: createExtendedLogger('api'),
  stv: createExtendedLogger('stv'),
  bttv: createExtendedLogger('bttv'),
  ffz: createExtendedLogger('ffz'),
  twitch: createExtendedLogger('twitch'),
  streamElements: createExtendedLogger('streamElements'),
  chat: createExtendedLogger('chat'),
  auth: createExtendedLogger('auth'),
  performance: createExtendedLogger('performance'),
  cache: createExtendedLogger('cache'),
  cachedPhotos: createExtendedLogger('cachedPhotos'),
  filesystem: createExtendedLogger('filesystem'),
  twitchWs: createExtendedLogger('twitchWs'),
  stvWs: createExtendedLogger('stvWs'),
  remoteConfig: createExtendedLogger('remoteConfig'),
};

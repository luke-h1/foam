import {
  logger as rnlogger,
  defLvlType,
  consoleTransport,
} from 'react-native-logs';
import type { transportFunctionType } from 'react-native-logs';

type TransportProps = Parameters<
  transportFunctionType<Record<string, unknown>>
>[0];

const MAX_LOG_STRING_LENGTH = 500;
const MAX_LOG_ARRAY_PREVIEW = 3;
const MAX_LOG_OBJECT_KEYS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmoteLike(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    typeof value.site === 'string'
  );
}

function summariseHomogeneousArray(value: unknown[]): string | null {
  if (value.length === 0) {
    return '[]';
  }

  const first = value[0];
  if (isEmoteLike(first)) {
    const site = typeof first.site === 'string' ? first.site : 'emote';
    return `[Array(${value.length}) ${site} emotes]`;
  }

  return null;
}

function sanitiseLogValue(value: string, seen?: WeakSet<object>): string;
function sanitiseLogValue(value: unknown, seen?: WeakSet<object>): unknown;
function sanitiseLogValue(value: unknown, seen = new WeakSet<object>()) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'string') {
    return value.length > MAX_LOG_STRING_LENGTH
      ? `${value.slice(0, MAX_LOG_STRING_LENGTH)}... [truncated]`
      : value;
  }

  if (Array.isArray(value)) {
    const summary = summariseHomogeneousArray(value);
    if (summary) {
      return summary;
    }

    if (value.length > MAX_LOG_ARRAY_PREVIEW) {
      return {
        length: value.length,
        preview: value
          .slice(0, MAX_LOG_ARRAY_PREVIEW)
          .map(item => sanitiseLogValue(item, seen)),
      };
    }

    return value.map(item => sanitiseLogValue(item, seen));
  }

  if (!isRecord(value)) {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (isEmoteLike(value)) {
    return {
      id: value.id,
      name: value.name,
      site: value.site,
    };
  }

  const result: Record<string, unknown> = {};
  const entries = Object.entries(value);
  for (const [key, nestedValue] of entries.slice(0, MAX_LOG_OBJECT_KEYS)) {
    result[key] = sanitiseLogValue(nestedValue, seen);
  }
  if (entries.length > MAX_LOG_OBJECT_KEYS) {
    result.__truncatedKeys = entries.length - MAX_LOG_OBJECT_KEYS;
  }

  return result;
}

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

type LoggingMethods = Record<defLvlType, (...args: unknown[]) => void>;

export type AllowedPrefix = keyof typeof loggingConfig;

const baseLogger = rnlogger.createLogger({
  // Release builds only emit warnings and errors; debug/info logging is dev-only
  // so production isn't spending CPU stringifying chat traffic.
  severity: __DEV__ ? 'debug' : 'warn',
  transport: __DEV__ ? [consoleTransport, genericTransport] : genericTransport,
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

const createExtendedLogger = (prefix: AllowedPrefix): LoggingMethods =>
  baseLogger.extend(prefix);

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

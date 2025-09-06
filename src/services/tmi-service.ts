/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import tmijs from 'tmi.js';

interface TmiServiceLogger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class TmiService {
  private static instance: tmijs.Client | null = null;

  private static options: tmijs.Options = {};

  private static logger: TmiServiceLogger = {
    info: (message: string, ...args: any[]) =>
      console.log(`[TMI-INFO] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[TMI-ERROR] ${message}`, ...args),
    warn: (message: string, ...args: any[]) =>
      console.warn(`[TMI-WARN] ${message}`, ...args),
    debug: (message: string, ...args: any[]) =>
      console.debug(`[TMI-DEBUG] ${message}`, ...args),
  };

  private static connectionPromise: Promise<void> | null = null;

  private static isDestroyed = false;

  private static currentChannels: Set<string> = new Set();

  // Private constructor to prevent instantiation
  // eslint-disable-next-line no-empty-function
  private constructor() {}

  public static setLogger(logger: TmiServiceLogger): void {
    TmiService.logger = logger;
  }

  public static getInstance(): tmijs.Client {
    if (TmiService.isDestroyed) {
      throw new Error('TmiService has been destroyed. Create a new instance.');
    }

    if (!TmiService.instance) {
      if (!TmiService.options || Object.keys(TmiService.options).length === 0) {
        throw new Error('Options must be set before getting instance');
      }

      TmiService.logger.info('Creating new TMI client instance');

      const opts: tmijs.Options = {
        ...TmiService.options,
        channels: [], // Start with no channels, we'll join them manually
        options: {
          debug: __DEV__,
          ...TmiService.options.options,
        },
        connection: {
          secure: true,
          reconnect: true,
          maxReconnectAttempts: 5,
          maxReconnectInterval: 30000,
          reconnectDecay: 1.5,
          reconnectInterval: 1000,
          ...TmiService.options.connection,
        },
      };

      TmiService.instance = new tmijs.Client(opts);
      TmiService.setupEventListeners();
    }
    return TmiService.instance;
  }

  public static setOptions(options: tmijs.Options): void {
    TmiService.logger.debug('Setting TMI options', {
      channels: options.channels,
      identity: options.identity
        ? { username: options.identity.username }
        : undefined,
      hasClientId: !!options.options?.clientId,
    });

    /**
     * Check if only channels changed
     */
    const oldChannels = TmiService.options.channels || [];
    const newChannels = options.channels || [];
    const channelsChanged =
      JSON.stringify(oldChannels) !== JSON.stringify(newChannels);

    /**
     * Check if other options changed (excluding channels)
     */
    const oldOptionsWithoutChannels = { ...TmiService.options };
    delete oldOptionsWithoutChannels.channels;
    const newOptionsWithoutChannels = { ...options };
    delete newOptionsWithoutChannels.channels;
    const otherOptionsChanged =
      JSON.stringify(oldOptionsWithoutChannels) !==
      JSON.stringify(newOptionsWithoutChannels);

    TmiService.options = { ...options };

    /**
     * If only channels changed and we have an instance, just update channels
     */
    if (TmiService.instance && channelsChanged && !otherOptionsChanged) {
      TmiService.logger.info(
        'Only channels changed, updating channels without recreating instance',
      );
      void TmiService.updateChannels(newChannels);
      return;
    }

    /**
     * If other options changed, we need to recreate the instance
     */
    if (TmiService.instance && otherOptionsChanged) {
      TmiService.logger.info(
        'Connection options changed, recreating TMI instance',
      );
      void TmiService.disconnect();
      TmiService.instance = null;
      TmiService.currentChannels.clear();
    }
  }

  public static async updateChannels(newChannels: string[]): Promise<void> {
    if (!TmiService.instance) {
      TmiService.logger.debug('No instance available for channel update');
      return;
    }

    const currentChannelsArray = Array.from(TmiService.currentChannels);
    const channelsToLeave = currentChannelsArray.filter(
      channel => !newChannels.includes(channel),
    );
    const channelsToJoin = newChannels.filter(
      channel => !TmiService.currentChannels.has(channel),
    );

    TmiService.logger.info('Updating channels', {
      current: currentChannelsArray,
      new: newChannels,
      toLeave: channelsToLeave,
      toJoin: channelsToJoin,
    });

    /**
     * Leave channels we're no longer interested in
     */
    await Promise.all(
      channelsToLeave.map(async channel => {
        try {
          await TmiService.instance?.part(channel);
          TmiService.currentChannels.delete(channel);
          TmiService.logger.info(`Left channel: ${channel}`);
        } catch (error) {
          TmiService.logger.error(`Failed to leave channel ${channel}:`, error);
        }
      }),
    );

    await Promise.all(
      channelsToJoin.map(async channel => {
        try {
          await TmiService.instance?.join(channel);
          TmiService.currentChannels.add(channel);
          TmiService.logger.info(`Joined channel: ${channel}`);
        } catch (error) {
          TmiService.logger.error(`Failed to join channel ${channel}:`, error);
        }
      }),
    );
  }

  public static async connect(): Promise<void> {
    if (TmiService.connectionPromise) {
      TmiService.logger.debug(
        'Connection already in progress, waiting for existing promise',
      );
      return TmiService.connectionPromise;
    }

    const instance = TmiService.getInstance();

    if (TmiService.isConnected()) {
      TmiService.logger.debug('Already connected');
      /**
       * Update channels after connecting
       */
      const channels = TmiService.options.channels || [];
      await TmiService.updateChannels(channels);
      return Promise.resolve();
    }

    if (TmiService.isConnecting()) {
      TmiService.logger.debug('Already connecting');
      return TmiService.connectionPromise || Promise.resolve();
    }

    TmiService.logger.info('Attempting to connect to TMI');

    TmiService.connectionPromise = instance
      .connect()
      .then(async () => {
        TmiService.logger.info('Successfully connected to TMI');
        TmiService.connectionPromise = null;

        /**
         * Join channels after connecting
         */
        const channels = TmiService.options.channels || [];
        await TmiService.updateChannels(channels);
      })
      .catch(error => {
        TmiService.logger.error('Failed to connect to TMI:', error);
        TmiService.connectionPromise = null;
        throw error;
      });

    return TmiService.connectionPromise;
  }

  public static async disconnect(): Promise<void> {
    if (!TmiService.instance) {
      TmiService.logger.debug('No instance to disconnect');
      return Promise.resolve();
    }

    if (TmiService.isDisconnected()) {
      TmiService.logger.debug('Already disconnected');
      return Promise.resolve();
    }

    TmiService.logger.info('Disconnecting from TMI');

    try {
      TmiService.currentChannels.clear();
      await TmiService.instance.disconnect();
      TmiService.logger.info('Successfully disconnected from TMI');
    } catch (error) {
      TmiService.logger.warn('Error during disconnect (ignoring):', error);
    }
  }

  public static destroy(): void {
    TmiService.logger.info('Destroying TMI service');
    TmiService.isDestroyed = true;
    void TmiService.disconnect();
    TmiService.instance = null;
    TmiService.options = {};
    TmiService.connectionPromise = null;
    TmiService.currentChannels.clear();
  }

  public static reset(): void {
    TmiService.logger.info('Resetting TMI service');
    TmiService.isDestroyed = false;
    void TmiService.disconnect();
    TmiService.instance = null;
    TmiService.connectionPromise = null;
    TmiService.currentChannels.clear();
  }

  public static isConnected(): boolean {
    const state = TmiService.instance?.readyState();
    const connected = state === 'OPEN';
    return connected;
  }

  public static isConnecting(): boolean {
    const state = TmiService.instance?.readyState();
    const connecting = state === 'CONNECTING';
    return connecting;
  }

  public static isDisconnected(): boolean {
    const state = TmiService.instance?.readyState();
    const disconnected = state === 'CLOSED' || state === undefined;
    return disconnected;
  }

  public static getConnectionState() {
    return TmiService.instance?.readyState();
  }

  public static getCurrentChannels(): string[] {
    return Array.from(TmiService.currentChannels);
  }

  public static on(
    event: keyof tmijs.Events,
    callback: (...args: any[]) => void,
  ): void {
    const instance = TmiService.getInstance();
    TmiService.logger.debug(`Adding event listener for: ${event}`);
    instance.on(event, callback);
  }

  public static off(
    event: keyof tmijs.Events,
    callback: (...args: any[]) => void,
  ): void {
    if (TmiService.instance) {
      TmiService.logger.debug(`Removing event listener for: ${event}`);
      TmiService.instance.removeListener(event, callback);
    }
  }

  private static setupEventListeners(): void {
    if (!TmiService.instance) return;

    TmiService.instance.on('connecting', (address, port) => {
      TmiService.logger.info(`Connecting to ${address}:${port}`);
    });

    TmiService.instance.on('connected', (address, port) => {
      TmiService.logger.info(`Connected to ${address}:${port}`);
    });

    TmiService.instance.on('disconnected', reason => {
      TmiService.logger.warn(`Disconnected: ${reason}`);
      TmiService.currentChannels.clear();
    });

    TmiService.instance.on('reconnect', () => {
      TmiService.logger.info('Attempting to reconnect...');
    });

    TmiService.instance.on('join', (channel, _username, self) => {
      if (self) {
        TmiService.logger.info(`Successfully joined channel: ${channel}`);
        TmiService.currentChannels.add(channel);
      }
    });

    TmiService.instance.on('part', (channel, _username, self) => {
      if (self) {
        TmiService.logger.info(`Successfully left channel: ${channel}`);
        TmiService.currentChannels.delete(channel);
      }
    });

    TmiService.instance.on('notice', (channel, msgid, message) => {
      TmiService.logger.warn(`Notice in ${channel} (${msgid}): ${message}`);
    });

    TmiService.instance.on(
      'messagedeleted',
      (channel, username, _deletedMessage, _userstate) => {
        TmiService.logger.info(`Message deleted in ${channel} by ${username}`);
      },
    );

    TmiService.instance.on('timeout', (channel, username, reason, duration) => {
      TmiService.logger.info(
        `User ${username} timed out in ${channel} for ${duration}s: ${reason}`,
      );
    });

    TmiService.instance.on('ban', (channel, username, reason) => {
      TmiService.logger.info(
        `User ${username} banned in ${channel}: ${reason}`,
      );
    });

    TmiService.instance.on('error' as keyof tmijs.Events, error => {
      TmiService.logger.error('TMI Client Error:', error);
    });
  }
}

/**
 * Hot reload
 * reset the singleton on hot reload
 */
if (__DEV__) {
  const globalKey = '__TMI_SERVICE_HOT_RELOAD__';
  const globalThisTyped: Record<string, unknown> = global as Record<
    string,
    unknown
  >;

  if (globalThisTyped[globalKey]) {
    console.log('[TMI] Hot reload detected, resetting service');
    TmiService.reset();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  globalThis[globalKey] = true;
}

export default TmiService;

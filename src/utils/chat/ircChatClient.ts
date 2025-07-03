import tmijs from 'tmi.js';

/**
 * Thin singleton wrapper around tmi.js to prevent multiple connections from being instantiated
 */
export class IrcChatClient {
  private static instance: IrcChatClient;

  client: tmijs.Client;

  private isConnected: boolean;

  constructor(options: tmijs.Options) {
    this.isConnected = false;
    this.client = new tmijs.Client({
      ...options,
    });
  }

  public static getInstance(options: tmijs.Options): IrcChatClient {
    if (!IrcChatClient.instance) {
      IrcChatClient.instance = new IrcChatClient(options);
    }
    return IrcChatClient.instance;
  }

  connect(): void {
    if (this.isConnected) {
      return;
    }
    void this.client.connect();
    this.isConnected = true;
  }

  disconnect(): void {
    if (!this.isConnected) {
      return;
    }
    void this.client.disconnect();
    this.isConnected = false;
  }
}

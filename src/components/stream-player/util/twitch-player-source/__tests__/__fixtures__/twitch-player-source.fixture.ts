import { createContext, runInContext } from 'node:vm';

export interface PlayerBridgeMessage {
  type: string;
  payload: unknown;
}

export interface PlayerScriptWindow {
  ReactNativeWebView: { postMessage: (message: string) => void };
  location: { hostname: string; search: string };
  localStorage: Storage;
  self?: PlayerScriptWindow;
  top?: unknown;
  __foamSetMuted?: (muted: boolean) => void;
}

interface RunPlayerScriptOptions {
  hostname?: string;
  search?: string;
  isTopFrame?: boolean;
}

export interface PlayerScriptPage {
  messages: PlayerBridgeMessage[];
  window: PlayerScriptWindow;
}

export function runPlayerScript(
  script: string,
  {
    hostname = 'player.twitch.tv',
    search = '',
    isTopFrame = true,
  }: RunPlayerScriptOptions = {},
): PlayerScriptPage {
  const messages: PlayerBridgeMessage[] = [];

  const window: PlayerScriptWindow = {
    ReactNativeWebView: {
      postMessage: message => {
        messages.push(JSON.parse(message));
      },
    },
    location: { hostname, search },
    localStorage: globalThis.localStorage,
  };

  window.self = window;
  window.top = isTopFrame ? window : {};

  runInContext(
    script,
    createContext({
      clearInterval,
      clearTimeout,
      Date,
      document,
      MutationObserver,
      setInterval,
      setTimeout,
      URLSearchParams,
      window,
    }),
  );

  return { messages, window };
}

export function setPageBody(html: string): HTMLElement {
  document.body.innerHTML = html;

  return document.body;
}

export async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export function resetPlayerPage(): void {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  globalThis.localStorage.clear();
}

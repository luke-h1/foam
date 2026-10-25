import { JSDOM } from 'jsdom';
import { createContext, runInContext } from 'node:vm';

// Fixture-owned JSDOM: native Jest env has no document. Use JSDOM's Event —
// Node's Event is skipped by dispatchEvent.
const playerDom = new JSDOM(
  '<!DOCTYPE html><html><head></head><body></body></html>',
  {
    url: 'https://player.twitch.tv/',
  },
);

const playerDocument = playerDom.window.document;
const playerLocalStorage = playerDom.window.localStorage;
const PlayerMutationObserver = playerDom.window.MutationObserver;

Object.defineProperty(globalThis, 'document', {
  configurable: true,
  writable: true,
  value: playerDocument,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: playerLocalStorage,
});

Object.defineProperty(globalThis, 'Event', {
  configurable: true,
  writable: true,
  value: playerDom.window.Event,
});

Object.defineProperty(globalThis, 'getComputedStyle', {
  configurable: true,
  writable: true,
  value: playerDom.window.getComputedStyle.bind(playerDom.window),
});

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
    localStorage: playerLocalStorage,
  };

  window.self = window;
  window.top = isTopFrame ? window : {};

  runInContext(
    script,
    createContext({
      clearInterval,
      clearTimeout,
      Date,
      document: playerDocument,
      MutationObserver: PlayerMutationObserver,
      setInterval,
      setTimeout,
      URLSearchParams,
      window,
    }),
  );

  return { messages, window };
}

export function setPageBody(html: string): HTMLElement {
  playerDocument.body.innerHTML = html;

  return playerDocument.body;
}

export async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export function resetPlayerPage(): void {
  playerDocument.head.innerHTML = '';
  playerDocument.body.innerHTML = '';
  playerLocalStorage.clear();
}

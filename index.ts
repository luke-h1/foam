import { registerRootComponent } from 'expo';
import App from './src/App';

import './src/styles/unistyles';

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes('[legend-state]') &&
    message.includes('Multiple elements in array have the same ID')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

registerRootComponent(App);

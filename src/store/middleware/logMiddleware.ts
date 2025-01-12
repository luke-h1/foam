import { PayloadAction } from '@reduxjs/toolkit';
import { Middleware } from 'redux';

export const logMiddleware: Middleware = () => next => (action: unknown) => {
  const typedAction = action as PayloadAction<unknown>;
  const enabled = __DEV__;

  if (enabled) {
    // eslint-disable-next-line no-console
    console.info('Triggered action ->', typedAction.type);
  }
  return next(action);
};

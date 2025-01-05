import { PayloadAction } from '@reduxjs/toolkit';
import { Middleware } from 'redux';

export const logMiddleware: Middleware = () => next => (action: unknown) => {
  const typedAction = action as PayloadAction<unknown>;

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info('Action:', typedAction);
  }
  return next(action);
};

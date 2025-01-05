import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { logMiddleware } from './middleware/logMiddleware';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(logMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

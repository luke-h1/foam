import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { logMiddleware } from './middleware/logMiddleware';
import { twitchApi } from './query/twitch';
import chatReducer from './reducers/chat/chatReducer';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    [twitchApi.reducerPath]: twitchApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(logMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

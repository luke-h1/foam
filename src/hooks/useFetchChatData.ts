import { AuthState, useAuthContext } from '@app/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { channelResourcesLoaded } from '@app/store/reducers/chat/chatReducer';
import {
  fetchAndMergeTwitchEmotes,
  fetchBttvChannelEmotes,
  fetchBttvGlobalBadges,
  fetchBttvGlobalEmotes,
  fetchChatterinoGlobalBadges,
  fetchFfzApGlobalBadges,
  fetchFfzChannelEmotes,
  fetchFfzEmoji,
  fetchFfzGlobalBadges,
  fetchFfzGlobalEmotes,
  fetchRecentMessages,
  fetchStvChannelEmotes,
  fetchStvGlobalEmotes,
  fetchTwitchChannelBadges,
} from '@app/store/reducers/chat/chatThunks';
import { optionsSelector } from '@app/store/selectors/cards';
import {
  channelResourcesLoadedSelector,
  currentChannelIdSelector,
  fetchChannelStatusSelector,
  fetchGlobalStatusSelector,
  fetchRecentMessagesStatusSelector,
  hasJoinedCurrentChannelSelector,
  isChannelReadySelector,
} from '@app/store/selectors/chat';
import { useEffect } from 'react';

export default function useFetchChatData() {
  const dispatch = useAppDispatch();
  const { authState } = useAuthContext();

  const channelNames = useAppSelector(
    state => state.chat.channels.ids as string[],
  );
  const options = useAppSelector(optionsSelector);
  const hasJoined = useAppSelector(hasJoinedCurrentChannelSelector);
  const fetchGlobalStatus = useAppSelector(fetchGlobalStatusSelector);
  const fetchChannelStatus = useAppSelector(fetchChannelStatusSelector);
  const fetchRecentMessagesStatus = useAppSelector(
    fetchRecentMessagesStatusSelector,
  );
  const isChannelReady = useAppSelector(isChannelReadySelector);

  const isChannelResourcesLoaded = useAppSelector(state =>
    channelResourcesLoadedSelector(state, authState as AuthState),
  );
  const channelName = useAppSelector(
    state => state.chat.currentChannel as string,
  );

  const channelId = useAppSelector(currentChannelIdSelector);

  useEffect(() => {
    if (!authState?.token || !channelId || !channelName) {
      // eslint-disable-next-line no-useless-return
      return;
    }

    if (fetchChannelStatus.badges.twitch === 'idle') {
      dispatch(
        fetchTwitchChannelBadges({
          channelId,
          channelName,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, channelName, authState]);

  // refetch twitch emote sets when channel changes
  useEffect(() => {
    if (!hasJoined) {
      // eslint-disable-next-line no-useless-return
      return;
    }

    dispatch(fetchAndMergeTwitchEmotes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasJoined]);

  // global badges + emotes
  useEffect(() => {
    if (fetchGlobalStatus.emotes.bttv === 'idle' && options.bttv.emotes) {
      dispatch(fetchBttvGlobalEmotes());
    }
    if (fetchGlobalStatus.badges.bttv === 'idle' && options.bttv.badges) {
      dispatch(fetchBttvGlobalBadges());
    }
    if (fetchGlobalStatus.emotes.ffz === 'idle' && options.ffz.emotes) {
      dispatch(fetchFfzGlobalEmotes());
    }
    if (fetchGlobalStatus.emotes.emoji === 'idle' && options.ffz.emoji) {
      dispatch(fetchFfzEmoji());
    }
    if (fetchGlobalStatus.badges.ffz === 'idle' && options.ffz.badges) {
      dispatch(fetchFfzGlobalBadges());
      dispatch(fetchFfzApGlobalBadges());
    }
    if (fetchGlobalStatus.emotes.stv === 'idle' && options.stv.emotes) {
      dispatch(fetchStvGlobalEmotes());
    }
    // if (fetchGlobalStatus.badges.stv === "idle" && options.stv.badges) {
    //   dispatch(fetchStvGlobalBadges());
    // }
    if (
      fetchGlobalStatus.badges.chatterino === 'idle' &&
      options.chatterino.badges
    ) {
      dispatch(fetchChatterinoGlobalBadges());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.bttv.emotes,
    options.bttv.badges,
    options.ffz.emotes,
    options.ffz.badges,
    options.stv.emotes,
    options.stv.badges,
    options.stv.badges,
    options.chatterino.badges,
  ]);

  // channel badges + emotes
  useEffect(() => {
    if (!channelId || !channelName) return;

    const params = { channelId, channelName };

    if (fetchChannelStatus.emotes.bttv === 'idle' && options.bttv.emotes) {
      dispatch(fetchBttvChannelEmotes(params));
    }
    if (fetchChannelStatus.emotes.ffz === 'idle' && options.ffz.emotes) {
      dispatch(fetchFfzChannelEmotes(params));
    }
    if (fetchChannelStatus.emotes.stv === 'idle' && options.stv.emotes) {
      dispatch(fetchStvChannelEmotes(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channelId,
    channelName,
    options.bttv.emotes,
    options.ffz.emotes,
    options.stv.emotes,
    options.recentMessages.load,
    fetchChannelStatus.badges.twitch,
    fetchChannelStatus.emotes.bttv,
    fetchChannelStatus.emotes.ffz,
    fetchChannelStatus.emotes.stv,
  ]);

  // recent messages
  useEffect(() => {
    if (channelNames.length === 0) return;
    // eslint-disable-next-line no-restricted-syntax
    for (const { name, status } of fetchRecentMessagesStatus) {
      if (status === 'idle' && options.recentMessages.load) {
        dispatch(fetchRecentMessages(name));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelNames.length, options.recentMessages.load]);

  useEffect(() => {
    if (isChannelReady) return;
    if (!isChannelResourcesLoaded) return;

    dispatch(channelResourcesLoaded());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChannelReady, isChannelResourcesLoaded]);
}

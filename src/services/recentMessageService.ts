import axios from 'axios';

export type RecentMessagesResponse = {
  messages: string[];
  error: null;
};

// TODO: build and deploy this and our own API - https://github.com/robotty/recent-messages2
// OR: re-write in a lang of our choice - i.e. c#
const recentMessageService = {
  listRecentMessages: async (
    channelName: string,
  ): Promise<RecentMessagesResponse> => {
    const { data } = await axios.get<RecentMessagesResponse>(
      `https://recent-messages.robotty.de/api/v2/recent-messages/${channelName}`,
      {
        params: {
          clearchatToNotice: true,
        },
      },
    );
    return data;
  },
} as const;

export default recentMessageService;

import axios from 'axios';

export type RecentMessagesResponse = {
  messages: string[];
  error: null;
};

// TODO: build and deploy this and our own API
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

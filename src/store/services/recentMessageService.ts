import axios from "axios";

export type RecentMessagesResponse = {
  messages: string[];
  error: null;
};

const recentMessageService = {
  listRecentMessages: async (
    channelName: string
  ): Promise<RecentMessagesResponse> => {
    const { data } = await axios.get<RecentMessagesResponse>(
      `https://recent-messages.robotty.de/api/v2/recent-messages/${channelName}?clearchatToNotice=true`
    );
    return data;
  },
} as const;

export default recentMessageService;

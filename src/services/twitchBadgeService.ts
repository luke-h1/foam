import {
  TwitchBadgesList,
  TwitchBadgesResponse,
} from '../utils/third-party/types';

interface FormattedBadgeList {
  id: string;
  versionId: string;
  channelId: string | null;
  title: string;
  description: string;
  clickAction: string;
  clickUrl: string;
  images: string[]; // 1x, 2x, 4x
}

const formatTwitchBadgesList = (
  data: TwitchBadgesResponse,
  channelId: string | null,
): FormattedBadgeList[] => {
  return data.flatMap(c =>
    c.versions.map(version => ({
      id: version.id,
      versionId: version.id,
      channelId,
      title: version.title,
      description: version.description,
      clickAction: version.clickAction || '',
      clickUrl: version.clickUrl || '',
      images: [
        version.image_url_1x,
        version.image_url_2x,
        version.image_url_4x,
      ],
    })),
  );
};

export type UnttvBadgesResponse = {
  id: string;
  versions: {
    id: string;
    title: string;
    description: string;
    clickAction: string;
    clickUrl: string;
    image_url_1x: string;
    image_url_2x: string;
    image_url_4x: string;
  }[];
}[];

// TODO: move this to our own service
const BASE_URL = 'https://unttv.vercel.app';

export const twitchBadgeService = {
  getChannelBadges: async (
    channelId: string | null,
  ): Promise<TwitchBadgesList> => {
    if (!channelId) {
      return [];
    }
    try {
      const resp = await fetch(`${BASE_URL}/badges/channel/${channelId}`);
      if (!resp.ok) throw Error();
      const data = (await resp.json()) as UnttvBadgesResponse;
      return formatTwitchBadgesList(data, channelId);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  },
  getTwitchGlobalBadges: async (): Promise<TwitchBadgesList> => {
    try {
      const resp = await fetch(`${BASE_URL}/badges/global`);
      if (!resp.ok) throw Error();
      const data = (await resp.json()) as UnttvBadgesResponse;
      return formatTwitchBadgesList(data, null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  },
} as const;

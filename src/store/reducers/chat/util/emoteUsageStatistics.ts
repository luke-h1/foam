import { storage } from '@app/utils/storage';
import { LocalStorageEmoteUsageStatistic } from '../types/emote';
import {
  MessagePart,
  MessagePartEmote,
  MessagePartType,
} from './messages/types/messages';

const EMOTE_TYPES: MessagePartType[] = [
  MessagePartType.TWITCH_EMOTE,
  MessagePartType.BTTV_EMOTE,
  MessagePartType.FFZ_EMOTE,
  MessagePartType.STV_EMOTE,
];

export function readEmotesUsageStatistic(): MessagePart[] {
  const stats = JSON.parse(storage.getString('emoteUsageStatistics') as string);

  if (!stats) {
    return [];
  }

  type Emote = MessagePartEmote & {
    uses: number;
    updatedAt: number;
  };
  const result: Emote[] = [];

  Object.entries(stats).forEach(([typeString, emotes]) => {
    const type = Number.parseInt(typeString, 10) as MessagePartEmote['type'];

    Object.entries(emotes as Emote).forEach(([id, [uses, updatedAt]]) => {
      result.push({ type, content: { id, modifiers: [] }, uses, updatedAt });
    });
  });

  result.sort((a, b) =>
    b.uses === a.uses ? b.updatedAt - a.updatedAt : b.uses - a.uses,
  );

  return result.map(({ type, content }) => ({
    type,
    content,
  }));
}

export function writeEmotesUsageStatistics(parts: MessagePart[]) {
  if (parts.length === 0) {
    // eslint-disable-next-line no-useless-return
    return;
  }

  const stats = JSON.parse(
    storage.getString('emoteUsageStatistics') as string,
  ) as LocalStorageEmoteUsageStatistic;

  // eslint-disable-next-line no-restricted-syntax
  for (const {
    type,
    content: { id },
  } of parts as MessagePartEmote[]) {
    const isEmote = EMOTE_TYPES.includes(type);
    // eslint-disable-next-line no-continue
    if (!isEmote) continue;
    if (!stats[type]) stats[type] = {};
    const [prevUses] = stats[type][id] || [0];
    stats[type][id] = [prevUses + 1, Date.now()];
  }

  storage.set('emoteUsageStatistics', JSON.stringify(stats, null, 2));
}

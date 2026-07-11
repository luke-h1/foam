import type { ChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

function createMessageParts(index: number): ParsedPart[] {
  return [{ type: 'text', content: `raid flood message ${index}` }];
}

export function createIngestMessage(
  index: number,
): ChatMessageType<'usernotice'> {
  const sender = `raider${index % 40}`;
  return {
    id: `ingest-${index}_nonce-${index}`,
    message_id: `ingest-${index}`,
    message_nonce: `nonce-${index}`,
    sender,
    channel: 'xqc',
    badges: [],
    cachedSenderColor: 'rgb(145, 70, 255)',
    message: createMessageParts(index),
    replyBody: '',
    replyDisplayName: '',
    parentDisplayName: '',
    timestamp: '12:00',
    userstate: createUserStateTags({
      username: sender,
      login: sender,
      'display-name': sender,
      'user-id': `uid-${index % 40}`,
      color: '#9146FF',
    }),
  };
}

/** Near-full window seed + burst that forces front-trim on a capped store. */
export const INGEST_SEED_COUNT = 120;
export const INGEST_BURST_COUNT = 80;

export const ingestSeedMessages = Array.from(
  { length: INGEST_SEED_COUNT },
  (_, index) => createIngestMessage(index),
);

export const ingestBurstMessages = Array.from(
  { length: INGEST_BURST_COUNT },
  (_, index) => createIngestMessage(INGEST_SEED_COUNT + index),
);

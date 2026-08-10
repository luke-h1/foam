import { logger } from '@app/utils/logger';

export type UnrenderableNoticeStage = 'ingest' | 'render';

interface ReportUnrenderableNoticeInput {
  msgId?: string;
  reason: string;
  stage: UnrenderableNoticeStage;
  systemMsg?: string;
}

const reported = new Set<string>();
const MAX_TRACKED_REPORTS = 200;

export function reportUnrenderableNotice({
  msgId,
  reason,
  stage,
  systemMsg,
}: ReportUnrenderableNoticeInput): void {
  const id = msgId || 'unknown';
  const key = `${stage}:${id}:${reason}`;

  if (reported.has(key)) {
    return;
  }

  if (reported.size >= MAX_TRACKED_REPORTS) {
    reported.clear();
  }
  reported.add(key);

  logger.chat.error('chat.notice.unrenderable', {
    name: 'twitch_chat_error',
    fingerprint: ['chat', 'notice', 'unrenderable', id, reason],
    tags: {
      msgId: id,
      noticeStage: stage,
      reason,
    },
    systemMsg,
  });
}

export function resetUnrenderableNoticeReports(): void {
  reported.clear();
}

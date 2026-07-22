import { theme } from '@app/styles/themes';

export const CHAT_NOTICE_ACCENTS = {
  announcement: theme.color.notice.announcement,
  channelPoints: theme.color.violet.dark,
  highlight: theme.color.notice.muted,
  subscription: theme.color.notice.subscription,
  charity: theme.color.notice.charity,
  ritual: theme.color.violet.dark,
  firstMessage: theme.color.violet.dark,
  returningChatter: theme.color.blue.dark,
  viewerMilestone: theme.color.violet.dark,
  raid: theme.color.orange.dark,
  replyToYou: theme.color.notice.announcement,
  stvAdded: theme.color.accent.dark,
  stvRemoved: theme.color.notice.announcement,
} as const;

export function noticeSurfaceTint(hex: string, alpha = 0.06): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(127, 127, 127, ${alpha})`;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

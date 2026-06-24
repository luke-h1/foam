import { theme } from '@app/styles/themes';

export const CHAT_NOTICE_ACCENTS = {
  announcement: theme.color.notice.announcement,
  channelPoints: theme.colorViolet,
  highlight: theme.color.notice.muted,
  subscription: theme.color.notice.subscription,
  charity: theme.color.notice.charity,
  ritual: theme.colorViolet,
  firstMessage: theme.colorViolet,
  returningChatter: theme.colorBlue,
  viewerMilestone: theme.colorViolet,
  raid: theme.colorOrange,
  replyToYou: theme.color.notice.announcement,
  stvAdded: theme.colorPrimary,
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

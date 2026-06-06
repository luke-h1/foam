import { theme } from '@app/styles/themes';

export const CHAT_NOTICE_ACCENTS = {
  announcement: '#EB0400',
  channelPoints: theme.colorViolet,
  highlight: '#ADADB8',
  subscription: '#FFD700',
  charity: '#00AD03',
  ritual: theme.colorViolet,
  firstMessage: theme.colorViolet,
  viewerMilestone: theme.colorViolet,
  raid: theme.colorOrange,
  replyToYou: '#EB0400',
  stvAdded: theme.colorPrimary,
  stvRemoved: '#EB0400',
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

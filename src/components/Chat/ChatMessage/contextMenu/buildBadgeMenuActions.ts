import type { MenuAction } from '@expo/ui/community/menu';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

export const BADGE_MENU_ACTION_IDS = {
  copyName: 'copy-badge-name',
  copyUrl: 'copy-badge-url',
  openInBrowser: 'open-badge-url',
} as const;

export function buildBadgeMenuActions(badge: SanitisedBadgeSet): MenuAction[] {
  const actions: MenuAction[] = [
    {
      id: BADGE_MENU_ACTION_IDS.copyName,
      title: 'Copy badge name',
      image: 'doc.on.doc',
    },
    {
      id: BADGE_MENU_ACTION_IDS.copyUrl,
      title: 'Copy badge URL',
      image: 'link',
    },
  ];

  if (badge.url) {
    actions.push({
      id: BADGE_MENU_ACTION_IDS.openInBrowser,
      title: 'Open in browser',
      image: 'arrow.up.right.square',
    });
  }

  return actions;
}

export function createBadgeMenuActionHandler(
  badge: SanitisedBadgeSet,
): (actionId: string) => void | Promise<void> {
  return async actionId => {
    switch (actionId) {
      case BADGE_MENU_ACTION_IDS.copyName:
        void Clipboard.setStringAsync(badge.title).then(() => {
          toast.success('Badge name copied');
        });
        return;
      case BADGE_MENU_ACTION_IDS.copyUrl:
        void Clipboard.setStringAsync(badge.url).then(() => {
          toast.success('Badge URL copied');
        });
        return;
      case BADGE_MENU_ACTION_IDS.openInBrowser:
        if (badge.url) {
          await openLinkInBrowser(badge.url);
        }
        return;
      default:
        return;
    }
  };
}

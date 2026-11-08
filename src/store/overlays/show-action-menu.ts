import { ActionSheetIOS, Platform } from 'react-native';

import {
  presentActionMenu,
  type ShowActionMenuOptions,
} from './action-menu-store';

export function showActionMenu({
  actions,
  title,
}: ShowActionMenuOptions): void {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...actions.map(action => action.label), 'Cancel'],
        cancelButtonIndex: actions.length,
      },
      buttonIndex => {
        actions[buttonIndex]?.onPress();
      },
    );

    return;
  }

  presentActionMenu({ actions, title });
}

import { ActionSheetIOS, Platform } from 'react-native';

import {
  presentActionMenu,
  type ShowActionMenuOptions,
} from './actionMenuStore';

export function showActionMenu({
  actions,
  cancelLabel,
  title,
}: ShowActionMenuOptions): void {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...actions.map(action => action.label), cancelLabel],
        cancelButtonIndex: actions.length,
      },
      buttonIndex => {
        actions[buttonIndex]?.onPress();
      },
    );
    return;
  }

  presentActionMenu({ actions, cancelLabel, title });
}

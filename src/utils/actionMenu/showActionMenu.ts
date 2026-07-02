import { ActionSheetIOS, Alert, Platform } from 'react-native';

interface ActionMenuAction {
  label: string;
  onPress: () => void;
}

interface ShowActionMenuOptions {
  title: string;
  actions: ActionMenuAction[];
  cancelLabel: string;
}

/**
 * Present a native action menu: ActionSheetIOS on iOS, an Alert dialog on
 * Android.
 */
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

  Alert.alert(title, undefined, [
    ...actions.map(action => ({ text: action.label, onPress: action.onPress })),
    { text: cancelLabel, style: 'cancel' as const },
  ]);
}

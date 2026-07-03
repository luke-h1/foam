import { ActionSheetIOS, Alert, Platform } from 'react-native';

import i18next from 'i18next';

interface ActionMenuAction {
  label: string;
  onPress: () => void;
}

interface ShowActionMenuOptions {
  title: string;
  actions: ActionMenuAction[];
  cancelLabel: string;
}

// Android's Alert.alert renders at most three buttons (neutral, negative,
// positive); extra buttons are silently dropped.
const MAX_ANDROID_ALERT_BUTTONS = 3;

function showAndroidActionMenu(
  title: string,
  actions: ActionMenuAction[],
  cancelLabel: string,
): void {
  if (actions.length + 1 <= MAX_ANDROID_ALERT_BUTTONS) {
    Alert.alert(
      title,
      undefined,
      [
        ...actions.map(action => ({
          text: action.label,
          onPress: action.onPress,
        })),
        { text: cancelLabel, style: 'cancel' as const },
      ],
      { cancelable: true },
    );
    return;
  }

  // Page the overflow behind a "More" button so no action is dropped.
  const visible = actions.slice(0, MAX_ANDROID_ALERT_BUTTONS - 1);
  const overflow = actions.slice(MAX_ANDROID_ALERT_BUTTONS - 1);
  Alert.alert(
    title,
    undefined,
    [
      ...visible.map(action => ({
        text: action.label,
        onPress: action.onPress,
      })),
      {
        text: i18next.t('common:more'),
        onPress: () => showAndroidActionMenu(title, overflow, cancelLabel),
      },
    ],
    { cancelable: true },
  );
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

  showAndroidActionMenu(title, actions, cancelLabel);
}

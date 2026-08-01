import { ActionSheetIOS } from 'react-native';

export interface IosActionSheetAction {
  label: string;
  destructive?: boolean;
  onPress?: () => void;
}

export interface PresentIosActionSheetOptions {
  actions: IosActionSheetAction[];
  cancelLabel: string;
  message?: string;
  /**
   * Runs after the tapped action, and on cancel.
   */
  onClose: () => void;
  title?: string;
}

export function presentIosActionSheet({
  actions,
  cancelLabel,
  message,
  onClose,
  title,
}: PresentIosActionSheetOptions): void {
  const destructiveButtonIndex = actions.flatMap((action, index) =>
    action.destructive ? [index] : [],
  );

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title,
      message,
      options: [...actions.map(action => action.label), cancelLabel],
      cancelButtonIndex: actions.length,
      destructiveButtonIndex:
        destructiveButtonIndex.length > 0 ? destructiveButtonIndex : undefined,
      // The chat surface is always dark themed.
      userInterfaceStyle: 'dark',
    },
    buttonIndex => {
      actions[buttonIndex]?.onPress?.();
      onClose();
    },
  );
}

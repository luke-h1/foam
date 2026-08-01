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
   * Called after the tapped action runs, and on cancel; the caller uses it to
   * flip its `visible` state back off since there is no JS sheet to dismiss.
   */
  onClose: () => void;
  title?: string;
}

/**
 * Presents chat actions through a real UIAlertController instead of the JS
 * bottom sheet. Chat rows stay plain JS pressables; this is invoked
 * imperatively from the existing long-press flow so no per-row native view is
 * ever mounted.
 */
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

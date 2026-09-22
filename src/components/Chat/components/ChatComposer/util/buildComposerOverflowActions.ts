import type { ComposerOverflowAction } from '@app/components/Chat/util/composerOverflowActions';

interface BuildComposerOverflowActionsOptions {
  canRecallLastMessage: boolean;
  isUploadingImage?: boolean;
  onAttachImage?: () => void;
  onOpenSettings?: () => void;
  onRecallLastMessage: () => void;
}

export function buildComposerOverflowActions({
  canRecallLastMessage,
  isUploadingImage,
  onAttachImage,
  onOpenSettings,
  onRecallLastMessage,
}: BuildComposerOverflowActionsOptions): ComposerOverflowAction[] {
  const actions: ComposerOverflowAction[] = [];

  if (onAttachImage) {
    actions.push({
      disabled: isUploadingImage,
      icon: 'photo',
      label: isUploadingImage ? 'Uploading image...' : 'Attach image',
      onPress: onAttachImage,
    });
  }

  if (canRecallLastMessage) {
    actions.push({
      icon: 'arrow.uturn.backward',
      label: 'Restore last message',
      onPress: onRecallLastMessage,
    });
  }

  if (onOpenSettings) {
    actions.push({
      icon: 'gearshape',
      label: 'Chat settings',
      onPress: onOpenSettings,
    });
  }

  return actions;
}

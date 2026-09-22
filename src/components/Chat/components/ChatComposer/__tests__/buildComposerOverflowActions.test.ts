import type { ComposerOverflowAction } from '@app/components/Chat/util/composerOverflowActions';

import { buildComposerOverflowActions } from '../util/buildComposerOverflowActions';

describe('buildComposerOverflowActions', () => {
  const onAttachImage = jest.fn();
  const onOpenSettings = jest.fn();
  const onRecallLastMessage = jest.fn();

  test('offers attach, recall and settings in that order', () => {
    const actions = buildComposerOverflowActions({
      canRecallLastMessage: true,
      onAttachImage,
      onOpenSettings,
      onRecallLastMessage,
    });

    expect(actions).toEqual<ComposerOverflowAction[]>([
      {
        disabled: undefined,
        icon: 'photo',
        label: 'Attach image',
        onPress: onAttachImage,
      },
      {
        icon: 'arrow.uturn.backward',
        label: 'Restore last message',
        onPress: onRecallLastMessage,
      },
      {
        icon: 'gearshape',
        label: 'Chat settings',
        onPress: onOpenSettings,
      },
    ]);
  });

  test('drops attach when there is no upload handler', () => {
    const actions = buildComposerOverflowActions({
      canRecallLastMessage: false,
      onOpenSettings,
      onRecallLastMessage,
    });

    expect(actions.map(action => action.label)).toEqual(['Chat settings']);
  });

  test('disables attach and relabels it while an upload runs', () => {
    const actions = buildComposerOverflowActions({
      canRecallLastMessage: false,
      isUploadingImage: true,
      onAttachImage,
      onOpenSettings,
      onRecallLastMessage,
    });

    expect({
      disabled: actions[0]?.disabled,
      label: actions[0]?.label,
    }).toEqual({ disabled: true, label: 'Uploading image...' });
  });
});

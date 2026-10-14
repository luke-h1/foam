import { createNativeChatListRef } from '../util/create-native-chat-list-ref';

describe('createNativeChatListRef', () => {
  test('ignores the composer inset report from the keyboard hook', () => {
    const ref = createNativeChatListRef(() => null);

    expect(() => ref.reportContentInset({ bottom: 48 })).not.toThrow();
  });

  test('throws on a list call the native list does not map', () => {
    const ref = createNativeChatListRef(() => null);

    expect(() => ref.scrollToOffset({ offset: 0 })).toThrow(
      'The native chat list does not support this list call.',
    );
  });
});

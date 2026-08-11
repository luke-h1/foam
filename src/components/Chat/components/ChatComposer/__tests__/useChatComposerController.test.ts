import { act, renderHook } from '@testing-library/react-native';

import {
  MAX_MESSAGE_LENGTH,
  useChatComposerController,
} from '../hooks/useChatComposerController';

jest.mock('@app/lib/haptics', () => ({ impact: jest.fn() }));

function renderController(
  options: Partial<Parameters<typeof useChatComposerController>[0]> = {},
) {
  const focusInput = jest.fn();
  const blurInput = jest.fn();
  const onSubmit = jest.fn();

  const utils = renderHook(() =>
    useChatComposerController({
      focusInput,
      blurInput,
      onSubmit,
      ...options,
    }),
  );

  return { ...utils, focusInput, blurInput, onSubmit };
}

describe('useChatComposerController', () => {
  test('blocks submitting a message past the length Twitch accepts', () => {
    const { result, onSubmit } = renderController();

    act(() => {
      result.current.handleChangeText('a'.repeat(MAX_MESSAGE_LENGTH + 1));
    });

    expect(result.current.isOverLimit).toBe(true);
    expect(result.current.submitEnabled).toBe(false);

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('allows a message exactly at the limit', () => {
    const { result, onSubmit } = renderController();

    act(() => {
      result.current.handleChangeText('a'.repeat(MAX_MESSAGE_LENGTH));
    });

    expect(result.current.isOverLimit).toBe(false);

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('counts the reply prefix the send path prepends but the input never shows', () => {
    const { result, onSubmit } = renderController({ reservedCharacters: 12 });

    act(() => {
      result.current.handleChangeText('a'.repeat(MAX_MESSAGE_LENGTH - 11));
    });

    // 489 typed + 12 reserved = 501 on the wire.
    expect(result.current.isOverLimit).toBe(true);
    expect(result.current.remainingCharacters).toBe(-1);

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('counts codepoints, not UTF-16 units, so emoji are not double charged', () => {
    const { result } = renderController();

    act(() => {
      result.current.handleChangeText('😀'.repeat(300));
    });

    // 300 codepoints is 600 UTF-16 units; Twitch counts the former.
    expect(result.current.isOverLimit).toBe(false);
  });

  test('reveals the remaining count only as the limit approaches', () => {
    const { result } = renderController();

    act(() => {
      result.current.handleChangeText('a'.repeat(MAX_MESSAGE_LENGTH - 51));
    });
    expect(result.current.showCharacterCount).toBe(false);

    act(() => {
      result.current.handleChangeText('a'.repeat(MAX_MESSAGE_LENGTH - 10));
    });
    expect(result.current.showCharacterCount).toBe(true);
    expect(result.current.remainingCharacters).toBe(10);
  });

  test('recalls the previous message once the input is cleared', () => {
    const { result, focusInput } = renderController();

    act(() => {
      result.current.handleChangeText('hello chat');
    });
    // Nothing to recall while the message is still being composed.
    expect(result.current.canRecallLastMessage).toBe(false);

    act(() => {
      result.current.handleSubmit();
    });
    // The parent clears the composer after a successful send.
    act(() => {
      result.current.handleChangeText('');
    });

    expect(result.current.canRecallLastMessage).toBe(true);

    act(() => {
      result.current.recallLastMessage();
    });

    expect(result.current.text).toBe('hello chat');
    expect(focusInput).toHaveBeenCalled();
  });

  test('reserves the recall slot from the first send so the row stops resizing', () => {
    const { result } = renderController();

    expect(result.current.hasLastMessage).toBe(false);

    act(() => {
      result.current.handleChangeText('hello');
    });
    act(() => {
      result.current.handleSubmit();
    });

    // Stays true while typing the next message, so the slot does not flicker.
    expect(result.current.hasLastMessage).toBe(true);
    expect(result.current.canRecallLastMessage).toBe(false);
  });

  test('opens the emote rail on a word typed after the first one, with no selection event', () => {
    const { result } = renderController();

    act(() => {
      result.current.setIsFocused(true);
    });
    act(() => {
      result.current.handleChangeText('hey ');
    });
    act(() => {
      result.current.handleChangeText('hey Kap');
    });

    expect(result.current.showEmoteRail).toBe(true);
    expect(result.current.wordInfo.searchTerm).toBe('Kap');
  });

  test('opens the mention rail on an @ typed after the first word, with no selection event', () => {
    const { result } = renderController();

    act(() => {
      result.current.setIsFocused(true);
    });
    act(() => {
      result.current.handleChangeText('gg @lu');
    });

    expect(result.current.showUserRail).toBe(true);
    expect(result.current.wordInfo.word).toBe('@lu');
  });

  test('follows the caret back to an earlier word when the selection moves', () => {
    const { result } = renderController();

    act(() => {
      result.current.setIsFocused(true);
    });
    act(() => {
      result.current.handleChangeText('@lu Kap');
    });
    expect(result.current.showEmoteRail).toBe(true);

    act(() => {
      result.current.handleSelectionChange(3);
    });

    expect(result.current.showUserRail).toBe(true);
    expect(result.current.wordInfo.word).toBe('@lu');
  });

  test('keeps the rails closed while the input is not focused', () => {
    const { result } = renderController();

    act(() => {
      result.current.handleChangeText('hey Kap');
    });

    expect(result.current.showEmoteRail).toBe(false);
  });

  test('records nothing when the parent has disabled sending', () => {
    const { result } = renderController({ canSend: false });

    act(() => {
      result.current.handleChangeText('never sent');
    });
    act(() => {
      result.current.handleSubmit();
    });
    act(() => {
      result.current.handleChangeText('');
    });

    expect(result.current.canRecallLastMessage).toBe(false);
  });
});

import { act, renderHook } from '@testing-library/react-native';

import * as haptics from '@app/lib/haptics';

import { useChatComposerController } from '../use-chat-composer-controller';

jest.spyOn(haptics, 'impact').mockImplementation(() => {});

function renderController(
  options: Partial<Parameters<typeof useChatComposerController>[0]> = {},
) {
  const focusInput = jest.fn();
  const blurInput = jest.fn();
  const onSubmit = jest.fn();

  const utils = renderHook(() =>
    useChatComposerController({
      canSend: true,
      focusInput,
      blurInput,
      onSubmit,
      ...options,
    }),
  );

  return { ...utils, focusInput, blurInput, onSubmit };
}

describe('useChatComposerController', () => {
  test('blocks submitting a message past the 500 characters Twitch accepts', () => {
    const { result, onSubmit } = renderController();

    act(() => {
      result.current.handleChangeText('a'.repeat(501));
    });

    expect(result.current.isOverLimit).toBe(true);

    expect(result.current.submitEnabled).toBe(false);

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('allows a message of exactly 500 characters', () => {
    const { result, onSubmit } = renderController();

    act(() => {
      result.current.handleChangeText('a'.repeat(500));
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
      result.current.handleChangeText('a'.repeat(489));
    });

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

    expect(result.current.isOverLimit).toBe(false);
  });

  test('reveals the remaining count only as the limit approaches', () => {
    const { result } = renderController();

    act(() => {
      result.current.handleChangeText('a'.repeat(449));
    });

    expect(result.current.showCharacterCount).toBe(false);

    act(() => {
      result.current.handleChangeText('a'.repeat(490));
    });

    expect(result.current.showCharacterCount).toBe(true);

    expect(result.current.remainingCharacters).toBe(10);
  });

  test('recalls the previous message once the input is cleared', () => {
    const { result, focusInput } = renderController();

    act(() => {
      result.current.handleChangeText('hello chat');
    });

    expect(result.current.canRecallLastMessage).toBe(false);

    act(() => {
      result.current.handleSubmit();
    });

    act(() => {
      result.current.handleChangeText('');
    });

    expect(result.current.canRecallLastMessage).toBe(true);

    act(() => {
      result.current.recallLastMessage();
    });

    expect(result.current.text).toBe('hello chat');

    expect(focusInput).toHaveBeenCalledTimes(1);
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

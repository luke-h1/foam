import { act, renderHook } from '@testing-library/react-native';

import {
  MAX_MESSAGE_LENGTH,
  useChatComposerController,
} from '../useChatComposerController';

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

  test('keeps the last message after a failed send attempt', () => {
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

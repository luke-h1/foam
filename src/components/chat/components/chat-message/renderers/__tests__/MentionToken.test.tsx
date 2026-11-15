import { Profiler } from 'react';

import { act, render } from '@testing-library/react-native';

import { getChatRowTextStyle } from '@app/components/chat/components/chat-message/util/chatRowTextStyle';
import { invalidateMentionColors } from '@app/store/chat/actions/invalidation';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { clearMentionIndexes } from '@app/utils/chat/resolve-mention-login/clearMentionIndexes';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';

import { MentionToken } from '../MentionToken';

const baseRowTextStyle = getChatRowTextStyle('text');

afterEach(() => {
  clearMentionIndexes();
});

function renderTwoMentions(colors: Map<string, string>) {
  const renders = { a: 0, b: 0 };

  const view = render(
    <>
      <Profiler
        id='a'
        onRender={() => {
          renders.a += 1;
        }}
      >
        <MentionToken
          content='@alice'
          baseRowTextStyle={baseRowTextStyle}
          getMentionColor={name => colors.get(name) ?? '#999999'}
        />
      </Profiler>
      <Profiler
        id='b'
        onRender={() => {
          renders.b += 1;
        }}
      >
        <MentionToken
          content='@bob'
          baseRowTextStyle={baseRowTextStyle}
          getMentionColor={name => colors.get(name) ?? '#999999'}
        />
      </Profiler>
    </>,
  );

  return { renders, view };
}

test('a mention revision bump re-renders only spans whose color changed', () => {
  const colors = new Map<string, string>();
  const { renders } = renderTwoMentions(colors);

  expect(renders).toEqual({ a: 1, b: 1 });

  colors.set('alice', '#ff0000');

  act(() => {
    invalidateMentionColors();
  });

  expect(renders).toEqual({ a: 2, b: 1 });
});

test('a mention revision bump shows the new login casing when the color is unchanged', () => {
  const view = render(
    <MentionToken
      content='@alice'
      baseRowTextStyle={baseRowTextStyle}
      getMentionColor={() => '#999999'}
    />,
  );

  expect(view.getByText('@alice')).toBeTruthy();

  registerMentionLogin('Alice');

  act(() => {
    chatStore$.mentionLoginRevision.set(revision => revision + 1);
  });

  expect(view.queryByText('@alice')).toBeNull();

  expect(view.getByText('@Alice')).toBeTruthy();
});

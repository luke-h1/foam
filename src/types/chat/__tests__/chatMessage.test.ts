import type { ChatMessageType } from '@app/types/chat/chatMessage';
import type { GlobalUserStateTags } from '@app/types/chat/irc-tags/globaluserstate';

type IsExactly<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

test('resolves globaluserstate notice tags to GlobalUserStateTags', () => {
  const resolvesToGlobalUserState: IsExactly<
    NonNullable<ChatMessageType<'globaluserstate'>['notice_tags']>,
    GlobalUserStateTags
  > = true;

  expect(resolvesToGlobalUserState).toBe(true);
});

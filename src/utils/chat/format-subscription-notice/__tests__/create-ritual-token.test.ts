import type { MessageToken } from '@app/utils/chat/message-token';

import { createRitualPart } from '../create-ritual-token';

describe('createRitualPart', () => {
  test('createRitualPart maps ritual notices', () => {
    const token = createRitualPart({
      'msg-id': 'ritual',
      'display-name': 'Viewer',
      'msg-param-ritual-name': 'new_chatter',
    });

    expect(token).toEqual<MessageToken<'ritual'>>({
      type: 'ritual',
      displayName: 'Viewer',
      ritualName: 'new_chatter',
      systemMsg: '',
      message: undefined,
    });
  });
});

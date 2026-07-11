import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { createRitualPart } from '../createRitualPart';

describe('createRitualPart', () => {
  test('createRitualPart maps ritual notices', () => {
    const part = createRitualPart({
      'msg-id': 'ritual',
      'display-name': 'Viewer',
      'msg-param-ritual-name': 'new_chatter',
    });

    expect(part).toEqual<ParsedPart<'ritual'>>({
      type: 'ritual',
      displayName: 'Viewer',
      ritualName: 'new_chatter',
      systemMsg: '',
      message: undefined,
    });
  });
});

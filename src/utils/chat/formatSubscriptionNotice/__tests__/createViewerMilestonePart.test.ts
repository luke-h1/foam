import { createViewerMilestoneTags } from '@app/types/chat/irc-tags/__fixtures__/userNoticeTags.fixture';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { createViewerMilestonePart } from '../createViewerMilestonePart';

describe('createViewerMilestonePart', () => {
  test('keeps the wording Twitch sent', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Krankel',
        login: 'krankel',
        'msg-param-value': '25',
        'system-msg': 'Krankel is currently on a 25-stream streak!',
      }),
    );

    expect(part).toEqual<ParsedPart<'viewermilestone'>>({
      type: 'viewermilestone',
      category: 'watch-streak',
      reward: '450',
      value: '25',
      content: '',
      systemMsg: 'Krankel is currently on a 25-stream streak!',
      login: 'krankel',
      displayName: 'Krankel',
    });
  });

  test('builds watch streak copy when the tag is missing', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Viewer',
        login: 'viewer',
        'msg-param-value': '10',
        'msg-param-copoReward': '',
        'system-msg': undefined,
      }),
    );

    expect(part.systemMsg).toBe(
      'Viewer watched 10 consecutive streams and sparked a watch streak!',
    );
  });

  test('keeps the message the viewer typed separate from the streak line', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Krankel',
        'system-msg': 'Krankel is currently on a 25-stream streak!',
      }),
      '  25 streams KEKW  ',
    );

    expect(part.content).toBe('25 streams KEKW');
    expect(part.systemMsg).toBe('Krankel is currently on a 25-stream streak!');
  });

  test('names the viewer when Twitch omits them from the streak line', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Krankel',
        'system-msg': 'is currently on a 25-stream streak!',
      }),
    );

    expect(part.systemMsg).toBe('Krankel is currently on a 25-stream streak!');
  });

  test('singularises a one-stream streak in the constructed copy', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Viewer',
        'msg-param-value': '1',
        'system-msg': undefined,
      }),
    );

    expect(part.systemMsg).toBe(
      'Viewer watched 1 consecutive stream and sparked a watch streak!',
    );
  });
});

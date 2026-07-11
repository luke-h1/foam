import { createViewerMilestoneTags } from '@app/types/chat/irc-tags/__fixtures__/userNoticeTags.fixture';

import { createViewerMilestonePart } from '../createViewerMilestonePart';

describe('createViewerMilestonePart', () => {
  test('createViewerMilestonePart builds watch streak copy', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Viewer',
        'msg-param-value': '10',
        'msg-param-copoReward': '',
      }),
    );

    expect(part.type).toBe('viewermilestone');
    expect(part.systemMsg).toBe(
      'Viewer watched 10 consecutive streams and sparked a watch streak!',
    );
  });
});

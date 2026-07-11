import { formatModerationSystemMessage } from '@app/components/Chat/util/formatModerationSystemMessage';

describe('formatModerationSystemMessage', () => {
  test('announces a timeout with its humanised duration', () => {
    expect(formatModerationSystemMessage('baduser', 1200)).toEqual(
      'baduser has been timed out for 20m',
    );
  });

  test('announces a permanent ban when there is no duration', () => {
    expect(formatModerationSystemMessage('baduser')).toEqual(
      'baduser has been permanently banned',
    );
  });
});

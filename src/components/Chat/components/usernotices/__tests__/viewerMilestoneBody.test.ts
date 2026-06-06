import {
  resolveViewerMilestoneBody,
  splitViewerMilestoneLead,
} from '../util/viewerMilestoneBody';

describe('viewerMilestoneBody', () => {
  test('prefers content over system message', () => {
    expect(
      resolveViewerMilestoneBody({
        content: 'LimeTitanTV watched 20 consecutive streams',
        displayName: 'LimeTitanTV',
        systemMsg: 'ignored',
      }),
    ).toBe('LimeTitanTV watched 20 consecutive streams');
  });

  test('splits a leading display name from the body once', () => {
    expect(
      splitViewerMilestoneLead(
        'LimeTitanTV watched 20 consecutive streams',
        'LimeTitanTV',
      ),
    ).toEqual({
      lead: 'LimeTitanTV',
      rest: 'watched 20 consecutive streams',
    });
  });
});

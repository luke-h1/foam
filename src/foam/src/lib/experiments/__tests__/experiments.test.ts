import { resolveExperimentVariant } from '../experiments';

describe('resolveExperimentVariant', () => {
  test('returns the assigned variant when it is valid', () => {
    expect(
      resolveExperimentVariant('chatComposerLayout', {
        chatComposerLayout: 'compact',
      }),
    ).toEqual('compact');
  });

  test('falls back to control when the experiment is unassigned', () => {
    expect(resolveExperimentVariant('chatComposerLayout', {})).toEqual(
      'control',
    );
  });

  test('falls back to control when the assigned value is unknown', () => {
    expect(
      resolveExperimentVariant('chatComposerLayout', {
        chatComposerLayout: 'not-a-real-variant',
      }),
    ).toEqual('control');
  });
});

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

describe('sevenTvPaintRenderer experiment', () => {
  test('resolves the skia variant when assigned', () => {
    expect(
      resolveExperimentVariant('sevenTvPaintRenderer', {
        sevenTvPaintRenderer: 'skia',
      }),
    ).toEqual('skia');
  });

  test('falls back to control when unassigned or unknown', () => {
    expect(resolveExperimentVariant('sevenTvPaintRenderer', {})).toEqual(
      'control',
    );
    expect(
      resolveExperimentVariant('sevenTvPaintRenderer', {
        sevenTvPaintRenderer: 'webview',
      }),
    ).toEqual('control');
  });
});

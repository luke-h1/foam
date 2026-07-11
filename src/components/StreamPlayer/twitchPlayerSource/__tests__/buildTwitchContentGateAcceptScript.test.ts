import { buildTwitchContentGateAcceptScript } from '../buildTwitchContentGateAcceptScript';

describe('buildTwitchContentGateAcceptScript', () => {
  test('content-gate accept clicks the anonymous classification gate', () => {
    const script = buildTwitchContentGateAcceptScript();

    expect(script).toContain(
      'asyncQuerySelector(\'button[data-a-target*="content-classification-gate"]\', 10000)',
    );
    expect(script).toContain('button.click()');
  });
});

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import type * as GetBttvBadges from '../getBttvBadges';
import type * as SetOnBttvBadgesLoaded from '../setOnBttvBadgesLoaded';

jest.mock('@app/services/bttv-emote-service', () => ({
  bttvEmoteService: {
    getSanitisedGlobalBadges: jest.fn(),
  },
}));

const badge: SanitisedBadgeSet = {
  id: 'bttv-developer',
  provider: 'bttv',
  set: 'bttv-developer',
  title: 'BTTV Developer',
  type: 'BTTV Developer',
  url: 'https://cdn.betterttv.net/tags/developer.svg',
};

let getBttvBadges: typeof GetBttvBadges.getBttvBadges;
let setOnBttvBadgesLoaded: typeof SetOnBttvBadgesLoaded.setOnBttvBadgesLoaded;
let getSanitisedGlobalBadges: jest.Mock;

function flush(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

describe('getBttvBadges', () => {
  beforeEach(() => {
    jest.resetModules();
    ({ getBttvBadges } = require('../getBttvBadges') as typeof GetBttvBadges);
    ({ setOnBttvBadgesLoaded } =
      require('../setOnBttvBadgesLoaded') as typeof SetOnBttvBadgesLoaded);
    const { bttvEmoteService } = require('@app/services/bttv-emote-service');
    getSanitisedGlobalBadges = jest.mocked(
      bttvEmoteService.getSanitisedGlobalBadges,
    );
  });

  test('returns empty until the fetch lands, then fires the loaded callback once', async () => {
    getSanitisedGlobalBadges.mockResolvedValue([badge]);
    const onLoaded = jest.fn();
    setOnBttvBadgesLoaded(onLoaded);

    expect(getBttvBadges()).toEqual<SanitisedBadgeSet[]>([]);
    await flush();

    expect(getBttvBadges()).toEqual<SanitisedBadgeSet[]>([badge]);
    expect(getSanitisedGlobalBadges).toHaveBeenCalledTimes(1);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  test('does not fire the loaded callback for an empty list', async () => {
    getSanitisedGlobalBadges.mockResolvedValue([]);
    const onLoaded = jest.fn();
    setOnBttvBadgesLoaded(onLoaded);

    getBttvBadges();
    await flush();

    expect(getBttvBadges()).toEqual<SanitisedBadgeSet[]>([]);
    expect(onLoaded).not.toHaveBeenCalled();
  });

  test('retries after the backoff window elapses without firing the callback early', async () => {
    jest.useFakeTimers();
    getSanitisedGlobalBadges.mockRejectedValueOnce(new Error('network'));
    const onLoaded = jest.fn();
    setOnBttvBadgesLoaded(onLoaded);

    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);
    expect(onLoaded).not.toHaveBeenCalled();

    getSanitisedGlobalBadges.mockResolvedValue([badge]);
    jest.advanceTimersByTime(10_000);
    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);

    expect(getBttvBadges()).toEqual<SanitisedBadgeSet[]>([badge]);
    expect(onLoaded).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('does not refetch inside the backoff window and doubles it per failure', async () => {
    jest.useFakeTimers();
    getSanitisedGlobalBadges.mockRejectedValue(new Error('network'));

    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);
    expect(getSanitisedGlobalBadges).toHaveBeenCalledTimes(1);

    getBttvBadges();
    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);
    expect(getSanitisedGlobalBadges).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(10_000);
    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);
    expect(getSanitisedGlobalBadges).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(10_000);
    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);
    expect(getSanitisedGlobalBadges).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(10_000);
    getBttvBadges();
    await jest.advanceTimersByTimeAsync(0);
    expect(getSanitisedGlobalBadges).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });
});

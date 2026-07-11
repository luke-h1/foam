import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import type * as BttvBadges from '../bttvBadges';

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

let getBttvBadges: typeof BttvBadges.getBttvBadges;
let setOnBttvBadgesLoaded: typeof BttvBadges.setOnBttvBadgesLoaded;
let getSanitisedGlobalBadges: jest.Mock;

function flush(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

describe('getBttvBadges', () => {
  beforeEach(() => {
    jest.resetModules();
    const module: typeof BttvBadges = require('../bttvBadges');
    ({ getBttvBadges, setOnBttvBadgesLoaded } = module);
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

  test('retries on the next read after a failed fetch without firing the callback', async () => {
    getSanitisedGlobalBadges.mockRejectedValueOnce(new Error('network'));
    const onLoaded = jest.fn();
    setOnBttvBadgesLoaded(onLoaded);

    getBttvBadges();
    await flush();
    expect(onLoaded).not.toHaveBeenCalled();

    getSanitisedGlobalBadges.mockResolvedValue([badge]);
    getBttvBadges();
    await flush();

    expect(getBttvBadges()).toEqual<SanitisedBadgeSet[]>([badge]);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });
});

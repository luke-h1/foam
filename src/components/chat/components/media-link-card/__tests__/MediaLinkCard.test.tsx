import { screen, waitFor } from '@testing-library/react-native';

import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { TwitchClip } from '@app/types/twitch/clip';

import { MediaLinkCard } from '../MediaLinkCard';

const SEVEN_TV_EMOTE_URL = 'https://7tv.app/emotes/01F6MZGCNG000255K4X1K96XKD';

describe('MediaLinkCard', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('renders a 7TV emote card as plain content, not a button', async () => {
    const getEmote = jest
      .spyOn(sevenTvService, 'getEmote')
      .mockResolvedValue(null);

    render(<MediaLinkCard type='stvEmoteLink' url={SEVEN_TV_EMOTE_URL} />);

    await waitFor(() => expect(getEmote).toHaveBeenCalledTimes(1));

    expect({
      buttons: screen.queryAllByRole('button').length,
      emoteIds: getEmote.mock.calls,
    }).toEqual({ buttons: 0, emoteIds: [['01F6MZGCNG000255K4X1K96XKD']] });
  });

  test('does not fetch a 7TV emote when the link holds no emote id', () => {
    const getEmote = jest
      .spyOn(sevenTvService, 'getEmote')
      .mockResolvedValue(null);

    render(
      <MediaLinkCard type='stvEmoteLink' url='https://7tv.app/emotes/bad' />,
    );

    expect(getEmote).not.toHaveBeenCalled();
  });

  test('renders a Twitch clip card as a button', async () => {
    /**
     * SAFETY: the card reads only optional clip fields, so an empty clip is a
     * valid response for this test.
     */
    jest.spyOn(twitchService, 'getClip').mockResolvedValue({} as TwitchClip);

    render(
      <MediaLinkCard
        type='twitchClip'
        url='https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage'
      />,
    );

    expect(await screen.findByRole('button')).toBeOnTheScreen();
  });
});

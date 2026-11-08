import { act, fireEvent } from '@testing-library/react-native';

import * as ImageModule from '@app/components/image/Image';
import {
  openChatEmoteActions,
  resetChatOverlays,
} from '@app/store/chat/actions/chat-overlays';
import { chatOverlays$ } from '@app/store/chat/observables/chat-overlays';
import type { EmotePressData } from '@app/store/chat/types/chat-press-data';
import render from '@app/test/render';

import * as assetPreviewSheetModule from '../asset-preview-sheet/AssetPreviewSheet';
import { ChatOverlayLayer } from '../ChatOverlayLayer';

interface CapturedAssetPreviewProps {
  asset: EmotePressData;
  kind: 'badge' | 'emote';
}

let assetPreviewProps: CapturedAssetPreviewProps | undefined;

Object.defineProperty(assetPreviewSheetModule, 'AssetPreviewSheet', {
  configurable: true,
  value: (props: CapturedAssetPreviewProps) => {
    assetPreviewProps = props;
    return null;
  },
});

jest.spyOn(ImageModule, 'Image').mockImplementation(() => <></>);

const CHANNEL_ID = 'channel-1';

const emote = {
  type: 'emote',
  content: 'Kappa',
  name: 'Kappa',
  original_name: 'Kappa',
  site: 'Twitch Global',
  url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
} satisfies EmotePressData;

function renderOverlayLayer() {
  return render(
    <ChatOverlayLayer
      canModerateChat={false}
      channelId={CHANNEL_ID}
      channelName='channel'
      hiddenUsers={[]}
      highlightedUsers={[]}
      hidePhraseFromView={jest.fn()}
      hideUserFromView={jest.fn()}
      onAppendMention={jest.fn()}
      onClearChatCache={jest.fn()}
      onClearImageCache={jest.fn()}
      onClearSevenTvCosmeticsCache={jest.fn()}
      onInsertEmote={jest.fn()}
      onInsertPhrase={jest.fn()}
      onPinMessage={jest.fn()}
      onRefreshPinnedMessage={jest.fn()}
      onReply={jest.fn()}
      onSettingsReconnect={jest.fn()}
      onSettingsRefetchEmotes={jest.fn()}
      onUnpinPinnedMessage={jest.fn()}
      pinnedMessageBusy={false}
      toggleHighlightedUser={jest.fn()}
    />,
  );
}

describe('ChatOverlayLayer emote actions', () => {
  beforeEach(() => {
    assetPreviewProps = undefined;
    resetChatOverlays(CHANNEL_ID);
  });

  test('shows the emote action sheet that a row long press opened', () => {
    const { queryByTestId } = renderOverlayLayer();

    const shownBeforeOpen = queryByTestId('emote-action-sheet') !== null;

    act(() => {
      openChatEmoteActions(CHANNEL_ID, emote);
    });

    const shownAfterOpen = queryByTestId('emote-action-sheet') !== null;

    expect([shownBeforeOpen, shownAfterOpen]).toEqual([false, true]);
  });

  test('preview swaps the action sheet for the emote preview sheet', () => {
    const { getByText, queryByTestId } = renderOverlayLayer();

    act(() => {
      openChatEmoteActions(CHANNEL_ID, emote);
    });

    fireEvent.press(getByText('Preview'));

    expect({
      actionSheetShown: queryByTestId('emote-action-sheet') !== null,
      previewAsset: assetPreviewProps?.asset,
      previewKind: assetPreviewProps?.kind,
      selectedEmoteAction: chatOverlays$.selectedEmoteAction.peek(),
    }).toEqual({
      actionSheetShown: false,
      previewAsset: {
        ...emote,
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
      },
      previewKind: 'emote',
      selectedEmoteAction: null,
    });
  });
});

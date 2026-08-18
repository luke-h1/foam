import {
  createElement,
  type ForwardedRef,
  Fragment,
  type ReactNode,
  useImperativeHandle,
} from 'react';
import { TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as LegendListReactNative from '@legendapp/list/react-native';
import { fireEvent } from '@testing-library/react-native';
import { measureFunction, measureRenders } from 'reassure';

import type { ThemedInputProps } from '@app/components/ui/Input/Input';
import * as InputModule from '@app/components/ui/Input/Input';
import { AuthContextTestProvider } from '@app/context/AuthContext';
import { EmoteSetKind } from '@app/graphql/generated/gql';
import * as selectorsModule from '@app/store/chat/react/selectors';
import type { SubscriberChannelProfile } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { EmoteSheet } from '../EmoteSheet';
import type { SetRailListExtra } from '../EmoteSheetSetRailItem';
import {
  buildEmoteMenuProviders,
  type EmoteMenuDataInput,
  type EmoteMenuListItem,
  type EmoteMenuSet,
  filterProviderSets,
  flattenProviderSets,
} from '../util/emoteMenuData';
import { createMenuEmote } from './__fixtures__/emoteMenuData.fixture';

type MockLegendListItem = EmoteMenuListItem | EmoteMenuSet;

type MockLegendListProps = {
  data: MockLegendListItem[];
  drawDistance?: number;
  estimatedItemSize: number;
  extraData?: SetRailListExtra;
  keyExtractor: (item: MockLegendListItem, index: number) => string;
  ref?: ForwardedRef<{
    scrollToEnd: () => void;
    scrollToIndex: () => void;
    scrollToOffset: () => void;
  }>;
  renderItem: (info: {
    extraData: SetRailListExtra | undefined;
    index: number;
    item: MockLegendListItem;
    target: 'Cell';
  }) => ReactNode;
};

const MOCK_VIEWPORT_HEIGHT = 680;

/**
 * The real LegendList is a forwardRef object, which the module's type
 * declarations expose as an exotic component rather than a plain function,
 * so the bridge below narrows through `never` to reach a spyable function.
 */
type MockableLegendListModule = {
  LegendList: (props: MockLegendListProps) => ReactNode;
};
// SAFETY: the real LegendList is the forwardRef exotic component described
// above; `never` is the only type TS accepts as a bridge to the plain
// function shape MockableLegendListModule.
const mockableLegendList: MockableLegendListModule =
  LegendListReactNative as never;

jest.spyOn(mockableLegendList, 'LegendList').mockImplementation(props => {
  const {
    data,
    drawDistance = 0,
    estimatedItemSize,
    extraData,
    keyExtractor,
    ref,
    renderItem,
  } = props;
  const rowCount = Math.ceil(
    (MOCK_VIEWPORT_HEIGHT + drawDistance * 2) / estimatedItemSize,
  );
  const visibleItems = data.slice(0, Math.max(1, rowCount));

  useImperativeHandle(ref, () => ({
    scrollToEnd: () => {},
    scrollToIndex: () => {},
    scrollToOffset: () => {},
  }));

  return createElement(
    View,
    null,
    visibleItems.map((item, index) =>
      createElement(
        Fragment,
        { key: keyExtractor(item, index) },
        renderItem({ extraData, index, item, target: 'Cell' }),
      ),
    ),
  );
});

// The iOS Input binds a SwiftUI TextField through native shared objects that
// don't exist under jest; the search box isn't part of what this file
// measures, so swap it for a plain TextInput.
jest
  .spyOn(InputModule, 'Input')
  .mockImplementation(
    ({
      onContentSizeChange: _onContentSizeChange,
      onSelectionChange: _onSelectionChange,
      onSubmitEditing: _onSubmitEditing,
      ...props
    }: ThemedInputProps) => createElement(TextInput, props),
  );

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

const CURRENT_USER_ID = '123456';

const SEVENTV_CHANNEL_SETS = [
  { setId: 'set-main', setName: 'Channel Main' },
  { setId: 'set-prime', setName: 'Channel Prime' },
  { setId: 'set-mods', setName: 'Mod Picks' },
];

function createEmotes(
  count: number,
  site: SanitisedEmote['site'],
  prefix: string,
  overrides: (index: number) => Partial<SanitisedEmote> = () => ({}),
): SanitisedEmote[] {
  return Array.from({ length: count }, (_, index) =>
    createMenuEmote(
      `${prefix}-${index}`,
      `${prefix}Emote${index}`,
      site,
      overrides(index),
    ),
  );
}

const subscriberProfiles: Record<string, SubscriberChannelProfile> = {};
for (let owner = 0; owner < 6; owner += 1) {
  subscriberProfiles[`owner-${owner}`] = {
    name: `Streamer${owner}`,
    profileImageUrl: `https://cdn.example.com/avatar-${owner}.png`,
  };
}

// A busy channel: ~2,600 emotes across every provider, 7TV split over three
// sets and subscriber emotes over six channels — the population the sheet's
// open-path build has to chew through on a real popular stream.
const menuInput: EmoteMenuDataInput = {
  sevenTvChannelEmotes: createEmotes(1200, '7TV Channel', 'stvc', index => {
    const set = SEVENTV_CHANNEL_SETS[index % SEVENTV_CHANNEL_SETS.length]!;
    return {
      set_metadata: {
        setId: set.setId,
        setName: set.setName,
        capacity: null,
        ownerId: null,
        kind: EmoteSetKind.Normal,
        updatedAt: '',
        totalCount: 400,
      },
    };
  }),
  sevenTvGlobalEmotes: createEmotes(300, '7TV Global', 'stvg'),
  sevenTvPersonalEmotes: createEmotes(25, '7TV Personal', 'stvp'),
  twitchGlobalEmotes: createEmotes(300, 'Twitch Global', 'ttvg'),
  twitchChannelEmotes: createEmotes(50, 'Twitch Channel', 'ttvc'),
  twitchSubscriberEmotes: createEmotes(
    280,
    'Twitch Subscriber',
    'ttvs',
    index => (index < 240 ? { owner_id: `owner-${index % 6}` } : {}),
  ),
  twitchSubscriberChannelProfiles: subscriberProfiles,
  bttvChannelEmotes: createEmotes(100, 'BTTV', 'bttvc'),
  bttvGlobalEmotes: createEmotes(100, 'Global BTTV', 'bttvg'),
  ffzChannelEmotes: createEmotes(100, 'FFZ', 'ffzc'),
  ffzGlobalEmotes: createEmotes(100, 'Global FFZ', 'ffzg'),
  emojis: ['😀', '😂', '😍', '👍', '👏', '❤️', '💜', '🔥'],
};

const mockEmoteData = {
  bttvChannelEmotes: menuInput.bttvChannelEmotes ?? [],
  bttvGlobalEmotes: menuInput.bttvGlobalEmotes ?? [],
  ffzChannelEmotes: menuInput.ffzChannelEmotes ?? [],
  ffzGlobalEmotes: menuInput.ffzGlobalEmotes ?? [],
  sevenTvChannelEmotes: menuInput.sevenTvChannelEmotes ?? [],
  sevenTvGlobalEmotes: menuInput.sevenTvGlobalEmotes ?? [],
  sevenTvPersonalEmotes: {
    [CURRENT_USER_ID]: menuInput.sevenTvPersonalEmotes ?? [],
  },
  twitchChannelEmotes: menuInput.twitchChannelEmotes ?? [],
  twitchGlobalEmotes: menuInput.twitchGlobalEmotes ?? [],
  twitchSubscriberEmotes: menuInput.twitchSubscriberEmotes ?? [],
  twitchSubscriberChannelProfiles:
    menuInput.twitchSubscriberChannelProfiles ?? {},
  twitchChannelBadges: [],
  twitchGlobalBadges: [],
  ffzChannelBadges: [],
  ffzGlobalBadges: [],
  chatterinoBadges: [],
};

jest
  .spyOn(selectorsModule, 'useCurrentEmoteData')
  .mockReturnValue(mockEmoteData);

const mockUser: UserInfoResponse = {
  id: CURRENT_USER_ID,
  login: 'blueberry42',
  display_name: 'Blueberry42',
  type: '',
  broadcaster_type: '',
  description: '',
  profile_image_url: '',
  offline_image_url: '',
  view_count: 0,
  created_at: '',
};

const TEST_TOKEN_EXPIRES_AT = 4_102_444_800_000;

function EmoteSheetPerfFixture() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <AuthContextTestProvider
        ready
        authState={{
          isLoggedIn: true,
          isAnonAuth: false,
          token: {
            accessToken: 'test-token',
            expiresIn: 3600,
            tokenType: 'bearer',
            expiresAt: TEST_TOKEN_EXPIRES_AT,
          },
        }}
        user={mockUser}
        loginWithTwitch={jest.fn()}
        logout={jest.fn()}
        populateAuthState={jest.fn()}
        fetchAnonToken={jest.fn()}
      >
        <EmoteSheet isPresented onDismiss={jest.fn()} />
      </AuthContextTestProvider>
    </SafeAreaProvider>
  );
}

describe('emote menu performance', () => {
  test('mounts the emote sheet and builds its content', async () => {
    await measureRenders(<EmoteSheetPerfFixture />, {
      ...MEASURE_OPTIONS,
      // The provider build is rAF-deferred behind the contentReady flag, so
      // mount alone only renders the spinner; waiting for the provider chips
      // pulls the deferred O(all emotes) build + first list render into the
      // measurement.
      scenario: async screen => {
        await screen.findByText('7TV');
      },
    });
  });

  /**
   * A round trip across the two heaviest providers - the sheet's worst
   * interaction, rebuilding a whole provider's grid each way.
   */
  test('switches provider tabs', async () => {
    await measureRenders(<EmoteSheetPerfFixture />, {
      ...MEASURE_OPTIONS,
      scenario: async screen => {
        await screen.findByText('Personal Emotes');
        fireEvent.press(screen.getByTestId('emote-provider-Twitch'));
        await screen.findByText('Streamer0');
        fireEvent.press(screen.getByTestId('emote-provider-7TV'));
        await screen.findByText('Personal Emotes');
      },
    });
  });

  test('builds emote menu providers from a full channel payload', async () => {
    await measureFunction(() => {
      buildEmoteMenuProviders(menuInput);
    }, MEASURE_OPTIONS);
  });

  test('filters provider sets for a search query', async () => {
    const provider = buildEmoteMenuProviders(menuInput)[0];

    await measureFunction(() => {
      filterProviderSets(provider, 'Emote12');
    }, MEASURE_OPTIONS);
  });

  test('flattens provider sets into grid rows', async () => {
    const provider = buildEmoteMenuProviders(menuInput)[0];
    const sets = filterProviderSets(provider, '');

    await measureFunction(() => {
      flattenProviderSets(sets, 6);
    }, MEASURE_OPTIONS);
  });
});

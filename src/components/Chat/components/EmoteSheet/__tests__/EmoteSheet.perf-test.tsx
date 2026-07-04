import { SafeAreaProvider } from 'react-native-safe-area-context';

import { measureFunction, measureRenders } from 'reassure';

import { AuthContextTestProvider } from '@app/context/AuthContext';
import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SubscriberChannelProfile } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { EmoteSheet } from '../EmoteSheet';
import {
  buildEmoteMenuProviders,
  type EmoteMenuDataInput,
  filterProviderSets,
  flattenProviderSets,
} from '../util/emoteMenuData';
import { createMenuEmote } from './__fixtures__/emoteMenuData.fixture';

jest.mock('@legendapp/list/react-native', () => {
  const React = require('react');
  const { View: MockView } = require('react-native');

  type MockLegendListProps = {
    data?: unknown;
    drawDistance?: unknown;
    estimatedItemSize?: unknown;
    extraData?: unknown;
    keyExtractor?: unknown;
    renderItem?: unknown;
  };

  const MOCK_VIEWPORT_HEIGHT = 680;
  const MOCK_FALLBACK_ROW_HEIGHT = 46;

  return {
    LegendList: React.forwardRef((props: MockLegendListProps, ref: unknown) => {
      const { data, extraData, keyExtractor, renderItem } = props;
      const items = Array.isArray(data) ? data : [];
      const renderRow = typeof renderItem === 'function' ? renderItem : null;
      const getKey = typeof keyExtractor === 'function' ? keyExtractor : null;
      const estimatedItemSize =
        typeof props.estimatedItemSize === 'number'
          ? props.estimatedItemSize
          : MOCK_FALLBACK_ROW_HEIGHT;
      const drawDistance =
        typeof props.drawDistance === 'number' ? props.drawDistance : 0;
      const rowCount = Math.ceil(
        (MOCK_VIEWPORT_HEIGHT + drawDistance * 2) / estimatedItemSize,
      );
      const visibleItems = items.slice(0, Math.max(1, rowCount));

      React.useImperativeHandle(ref, () => ({
        scrollToEnd: () => {},
        scrollToIndex: () => {},
        scrollToOffset: () => {},
      }));

      return React.createElement(
        MockView,
        null,
        visibleItems.map((item, index) =>
          React.createElement(
            React.Fragment,
            { key: getKey ? getKey(item, index) : String(index) },
            renderRow
              ? renderRow({ extraData, index, item, target: 'Cell' })
              : null,
          ),
        ),
      );
    }),
  };
});

jest.mock('@app/store/chat/react/selectors', () => ({
  ...jest.requireActual('@app/store/chat/react/selectors'),
  useCurrentEmoteData: () => mockEmoteData,
}));

// The iOS Input binds a SwiftUI TextField through native shared objects that
// don't exist under jest; the search box isn't part of what this file
// measures, so swap it for a plain TextInput.
jest.mock('@app/components/ui/Input/Input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');

  return {
    Input: React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(TextInput, { ...props, ref }),
    ),
  };
});

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
    } as Partial<SanitisedEmote>;
  }),
  sevenTvGlobalEmotes: createEmotes(300, '7TV Global', 'stvg'),
  sevenTvPersonalEmotes: createEmotes(25, '7TV Personal', 'stvp'),
  twitchGlobalEmotes: createEmotes(300, 'Twitch Global', 'ttvg'),
  twitchChannelEmotes: createEmotes(50, 'Twitch Channel', 'ttvc'),
  twitchSubscriberEmotes: createEmotes(
    280,
    'Twitch Subscriber',
    'ttvs',
    index =>
      index < 240
        ? ({ owner_id: `owner-${index % 6}` } as Partial<SanitisedEmote>)
        : {},
  ),
  twitchSubscriberChannelProfiles: subscriberProfiles,
  bttvChannelEmotes: createEmotes(100, 'BTTV', 'bttvc'),
  bttvGlobalEmotes: createEmotes(100, 'Global BTTV', 'bttvg'),
  ffzChannelEmotes: createEmotes(100, 'FFZ', 'ffzc'),
  ffzGlobalEmotes: createEmotes(100, 'Global FFZ', 'ffzg'),
  emojis: ['😀', '😂', '😍', '👍', '👏', '❤️', '💜', '🔥'],
};

const mockEmoteData = {
  bttvChannelEmotes: menuInput.bttvChannelEmotes,
  bttvGlobalEmotes: menuInput.bttvGlobalEmotes,
  ffzChannelEmotes: menuInput.ffzChannelEmotes,
  ffzGlobalEmotes: menuInput.ffzGlobalEmotes,
  sevenTvChannelEmotes: menuInput.sevenTvChannelEmotes,
  sevenTvGlobalEmotes: menuInput.sevenTvGlobalEmotes,
  sevenTvPersonalEmotes: {
    [CURRENT_USER_ID]: menuInput.sevenTvPersonalEmotes,
  },
  twitchChannelEmotes: menuInput.twitchChannelEmotes,
  twitchGlobalEmotes: menuInput.twitchGlobalEmotes,
  twitchSubscriberEmotes: menuInput.twitchSubscriberEmotes,
  twitchSubscriberChannelProfiles: menuInput.twitchSubscriberChannelProfiles,
};

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

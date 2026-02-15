import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { AppStackParamList } from './AppNavigator';

/**
 * Deep linking configuration for all screens in the app.
 * Examples:
 * - foam://tabs/following
 * - foam://streams/live-stream/123
 * - foam://streams/streamer-profile/456
 * - foam://category/789
 * - foam://chat?channelName=test&channelId=123
 * - foam://tabs/settings/profile
 * - foam://preferences/chat
 * - foam://login
 * - foam://storybook
 *
 * https://reactnavigation.org/docs/deep-linking#integrating-with-other-tools
 */
export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [Linking.createURL('/'), 'foam://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Following: 'tabs/following',
          Top: {
            screens: {
              TopHome: 'tabs/top',
              TopCategories: 'tabs/top/categories',
              TopStreams: 'tabs/top/streams',
            },
          },
          Search: 'tabs/search',
          Settings: {
            screens: {
              Index: 'tabs/settings',
              Profile: 'tabs/settings/profile',
              Appearance: 'tabs/settings/appearance',
              ChatPreferences: 'tabs/settings/chat-preferences',
              DevTools: 'tabs/settings/dev-tools',
              Other: 'tabs/settings/other',
              About: 'tabs/settings/about',
              CachedImages: 'tabs/settings/cached-images',
              Diagnostics: 'tabs/settings/diagnostics',
              RemoteConfig: 'tabs/settings/remote-config',
              Licenses: 'tabs/settings/licenses',
              Faq: 'tabs/settings/faq',
              Changelog: 'tabs/settings/changelog',
              Debug: 'tabs/settings/debug',
              Storybook: 'tabs/settings/storybook',
            },
          },
        },
      },
      Streams: {
        screens: {
          LiveStream: 'streams/live-stream/:id',
          StreamerProfile: 'streams/streamer-profile/:id',
        },
      },
      Top: {
        screens: {
          TopHome: 'top',
          TopCategories: 'top/categories',
          TopStreams: 'top/streams',
        },
      },
      Category: 'category/:id',
      Login: 'login',
      AuthCallback: 'auth',
      Storybook: 'storybook',
      Preferences: {
        screens: {
          Chat: 'preferences/chat',
          Video: 'preferences/video',
          Theming: 'preferences/theming',
          BlockedUsers: 'preferences/blocked-users',
        },
      },
      // Chat Screen
      Chat: {
        path: 'chat',
        parse: {
          channelName: (channelName: string) => channelName,
          channelId: (channelId: string) => channelId,
        },
      },
      DevTools: {
        screens: {
          Diagnostics: 'dev-tools/diagnostics',
          SentryDemo: 'dev-tools/sentry-demo',
          Debug: 'dev-tools/debug',
        },
      },
      Other: {
        screens: {
          About: 'other/about',
          Changelog: 'other/changelog',
          Faq: 'other/faq',
          Licenses: 'other/licenses',
        },
      },
    },
  },
};
